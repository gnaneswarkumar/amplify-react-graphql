import logo from './logo.svg';
import { useEffect, useState } from 'react';

import { generateClient } from 'aws-amplify/api';
import { Amplify } from 'aws-amplify';
import { 
  withAuthenticator,
  Button,
  Flex, 
  Heading, 
  Image,
  View,
  Card,
  Text,
  TextField
 } from '@aws-amplify/ui-react';

 import { listNotes } from './graphql/queries';
 import { 
  createNote as createNoteMutation, 
  deleteNote as deleteNoteMutation } from './graphql/mutations';

const client = generateClient();

function App({ signOut }) {
  
  const [notes, setNotes] = useState([]);

  useEffect(()=>{
    fetchNotes();
  }, []);

  async function fetchNotes(){
    const apiData = await client.graphql({query: listNotes});
    const notesFromApi = apiData.data.listNotes.items;

    await Promise.all(
      notesFromApi.map(async(note)=>{
        if(note.image){
          const url = await Storage.get(note.name);
          note.image = url;
        }
        return note;
      })
    );

    console.log("notesFromApi==>", notesFromApi);
    setNotes(notesFromApi);
  }

  async function createNote(event){
    event.preventDefault();
    const form = new FormData(event.target);
    const image = form.get("image");

    const data = {
      name: form.get("name"),
      description: form.get("description"),
      image: image.name
    }

    if (!!data.image) await Storage.put(data.name, image);

    await client.graphql({
      query: createNoteMutation,
      variables: {input : data }
    });

    fetchNotes();
    event.target.reset();
  }

  async function deleteNote({ id, name }) {
    const newNotes = notes.filter((note) => note.id !== id);
    setNotes(newNotes);
    await Storage.remove(name);
    await client.graphql({
      query: deleteNoteMutation,
      variables: { input: { id } },
    });
  }

  return (
    <View className="App">
      <Heading level={1}>My Notes App</Heading>
      <View as="form" margin="3rem" onSubmit={createNote}>
        <Flex direction="row" justifyContent="center">
          <TextField
            name='name'
            placeholder='Note name'
            labelHidden
            validation="quiet"
            required />
          <TextField
            name='description'
            placeholder='note description'
            labelHidden
            validation="quiet"
            required
          />
          <View
            name="image"
            as="input"
            type="file"
            style={{ alignSelf: "end" }}
          />
        </Flex>
        <Flex margin={"3rem"} direction={"row"} justifyContent={"center"}>
          <Button type='Submit' variation='primary'>Create Note</Button>
        </Flex>
      </View>
  
      <Heading level={2}>Current Notes</Heading>
      <View margin="3rem">
        {notes.map(note=>{
          console.log("note==>", note.name);
          return <Flex
            key={note.id || note.name }
            direction={'row'}
            justifyContent={'center'}
            alignItems={'center'}
          >
            <Text as="strong" fontWeight={700}>{note.name}</Text>
            <Text as="span">{note.description}</Text>
            {note.image && (
              <Image
                src={note.image}
                alt={`visual aid for ${notes.name}`}
                style={{ width: 400 }}
              />
            )}
            <Button variation='link' onClick={()=>deleteNote(note)}>Delete Note</Button>
          </Flex>
        })}
      </View>
      <Button onClick={signOut}>Sign Out</Button>
    </View>
  );
}

export default withAuthenticator(App);
