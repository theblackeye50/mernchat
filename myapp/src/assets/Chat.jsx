import React, { useContext, useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";
import Logo from "./Logo";
import { UserContext } from "./Usercontext";
import uniqBy from 'lodash/uniqBy';
import axios from "axios";
import Contact from "./Contact";

function Chat() {
  const [ws, setws] = useState(null);
  const [onlinePeople, setonlinePeople] = useState({});
  const [offlinePoeple, setOfflinePoeple] =useState({});
  const [selectUserId, setselectUserId] = useState(null);
  const [newmessagetext, setnewmessagetext] = useState("");
  const [messages, setMessages] = useState([]);
  const { username, id , setId, setUsername} = useContext(UserContext);
  const divUnderMessage = useRef();

  
  useEffect(() => {
   connectToWs();
  }, []);

  function connectToWs()
  {
    const ws = new WebSocket("ws://localhost:4040");
    setws(ws);
    ws.addEventListener("message", handlemessage);
    ws.addEventListener('close',()=> { 
      setTimeout(() => {
        // console.log('dissconnected, Trying to recconnect');
        connectToWs();
      }, 1000);
    });
  }

  function showOnlinePeople(peopleArray) { 
    const people = {};
    peopleArray.forEach(({ userId, username }) => {
      people[userId] = username;
    });
    // console.log(people);
    setonlinePeople(people);
  }

  function handlemessage(ev) {
    const messageData = JSON.parse(ev.data);
    if ("online" in messageData) {
      showOnlinePeople(messageData.online);
    } else  if('text' in messageData){
      setMessages(prev=>([...prev, {...messageData}]));
    }
  }

  function logout(){
    axios.post('/logout').then(() => {
      setws(null);
      setId(null);
      setUsername(null);
    })
  }

  

  function sendmessage(ev , file = null) {
    if(ev) ev.preventDefault();
    ws.send(
      JSON.stringify({
        message: {
          recipient: selectUserId,
          text: newmessagetext,
          file,
        },
      })
    );
    setnewmessagetext("");
    console.log('message sent')
    setMessages((prev) => [...prev, { text: newmessagetext, sender:id , recipient:selectUserId ,_id:Date.now()}]);

    if(file)
    {
      axios.get('/message/'+selectUserId).then((res) => {
        setMessages(res.data);
      });
    }
  }

  function sendFile(ev){
    const reader = new FileReader();
    reader.readAsDataURL(ev.target.files[0]);
    reader.onload = ()=>{
      sendmessage(null,{
        name:ev.target.files[0].name,
        data:reader.result,
      });
    };
  }

  useEffect(()=>{
  
    const div = divUnderMessage.current;
    if(div)
    {
      div.scrollIntoView({behavior:'smooth', block:'end'});
    }
  },[messages])
  
  useEffect(()=>{
    axios.get('/people').then(res=>{
      const offlinePeopleArr = res.data
      .filter(p=>p._id !== id)
      .filter(p=> !Object.keys(onlinePeople).includes(p._id));
      const offlinePeople={};
      offlinePeopleArr.forEach(p=>{
        offlinePeople[p._id]=p;
      })
      // console.log({offlinePeople,offlinePeopleArr});
      setOfflinePoeple(offlinePeople);
    })
  })


  useEffect(()=>{
    if(selectUserId)
    {
      axios.get('/message/'+selectUserId).then((res) => {
        setMessages(res.data);
      });

    }
  },[selectUserId])

  const onlinePeopleExclourUser = { ...onlinePeople };
  delete onlinePeopleExclourUser[id];
  
  const messageWithoutDupes = uniqBy(messages,'_id');

  return (
    <div className=" flex h-screen">
      <div className="bg-white-100 w-1/3 flex flex-col">
      <div className="flex-grow">
      <Logo />
        {Object.keys(onlinePeopleExclourUser).map((userId) => (
         <Contact 
         key={userId}
         id={userId} 
         online={true}
         username={onlinePeopleExclourUser[userId]}
         onClick={()=>setselectUserId(userId)}
         selected={userId === selectUserId}/>
        ))}
        {Object.keys(offlinePoeple).map((userId) => (
         <Contact 
         key={userId}
         id={userId} 
         online={false}
         username={offlinePoeple[userId].username}
         onClick={()=>setselectUserId(userId)}
         selected={userId === selectUserId}/>
        ))}
      </div>
         <div className="p-2 text-center flex items-center justify-center">
          <span className="mr-2 text-sm text-black-500 flex items-center"> 
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
             <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
         </svg>
           {username}</span>
          <button 
          onClick={logout}
          className="text-sm text-gray-600 bg-blue-100 py-1 px-2 rounded-sm">Logout</button>
         </div>
      </div>
      <div className=" flex flex-col bg-blue-50 w-2/3 p-2 ">
        <div className="flex-grow">
          {!selectUserId && (
            <div className="flex h-full flex-grow items-center justify-center">
              <div className="text-gray-400">
                {" "}
                &larr; Select a person from side{" "}
              </div>
            </div>
          )}
          {!!selectUserId && (
            <div className="relative h-full">
             <div  className="overflow-y-scroll absolute left-0 right-0 top-0 bottom-2">
              {messageWithoutDupes.map((message) => (
                <div key={message._id} className={(message.sender===id ? 'text-right': 'text-left')}>
                  <div key={message._id} className={"text-left inline-block p-2 my-2 rounded-md text-sm " + (message.sender===id? 'bg-blue-500 text-white' : 'bg-white text-grey')}>
                  {/* sender:{message.sender} <br/>
                  my id:{id}<br/> */}
                  {message.text}
                  {message.file && (
                    <div className="">
                      <a target="_blank"  className=" flex item-center gap-1 underline border-b" href={axios.defaults.baseURL + '/uploads' + message.file}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                         <path fillRule="evenodd" d="M18.97 3.659a2.25 2.25 0 0 0-3.182 0l-10.94 10.94a3.75 3.75 0 1 0 5.304 5.303l7.693-7.693a.75.75 0 0 1 1.06 1.06l-7.693 7.693a5.25 5.25 0 1 1-7.424-7.424l10.939-10.94a3.75 3.75 0 1 1 5.303 5.304L9.097 18.835l-.008.008-.007.007-.002.002-.003.002A2.25 2.25 0 0 1 5.91 15.66l7.81-7.81a.75.75 0 0 1 1.061 1.06l-7.81 7.81a.75.75 0 0 0 1.054 1.068L18.97 6.84a2.25 2.25 0 0 0 0-3.182Z" clipRule="evenodd" />
                      </svg>
                      {message.file} 
                      </a>
                    </div>
                  )}
                  </div>
                </div>
              ))}
              <div ref={divUnderMessage}></div>
             </div>
            </div>
          )}
        </div>

        {!!selectUserId && (
          <form className="flex gap-2" onSubmit={sendmessage}>
            <input
              type="text"
              value={newmessagetext}
              onChange={(ev) => setnewmessagetext(ev.target.value)}
              className="bg-white border flex-grow rounded-sm p-2"
              placeholder="Type your message here"
            />
            <label className=" bg-blue-200 p-2 rounded-sm text-gray-600 border cursor-pointer border-blue-300">
              <input type="file" className="hidden" onChange={sendFile}/>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
              <path fillRule="evenodd" d="M18.97 3.659a2.25 2.25 0 0 0-3.182 0l-10.94 10.94a3.75 3.75 0 1 0 5.304 5.303l7.693-7.693a.75.75 0 0 1 1.06 1.06l-7.693 7.693a5.25 5.25 0 1 1-7.424-7.424l10.939-10.94a3.75 3.75 0 1 1 5.303 5.304L9.097 18.835l-.008.008-.007.007-.002.002-.003.002A2.25 2.25 0 0 1 5.91 15.66l7.81-7.81a.75.75 0 0 1 1.061 1.06l-7.81 7.81a.75.75 0 0 0 1.054 1.068L18.97 6.84a2.25 2.25 0 0 0 0-3.182Z" clipRule="evenodd" />
           </svg>
            </label>
            
            <button
              type="submit"
              className="bg-blue-500 p-2 text-white rounded-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                />
              </svg>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Chat;
