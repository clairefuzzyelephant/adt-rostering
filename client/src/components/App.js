import React, { useState, useEffect } from "react";
import { Router, Location } from "@reach/router";
import { get, post } from "../utilities.js";
import NotFound from "./pages/NotFound.js";
import NavBar from "./modules/NavBar.js";
import Dance from "./pages/Dance.js";
import Admin from "./pages/Admin.js";
import FullRoster from "./pages/FullRoster.js";

import logo from "../public/adt_rectangle_logo.png";

import { socket } from "../client-socket.js";

import "../utilities.css";
import "./App.css";

import OnRouteChangeWorker from "./OnRouteChangeWorker.js";

const OnRouteChange = ( { action } ) => (
  <Location>
    {({ location }) => <OnRouteChangeWorker location={location} action={action} />}
  </Location>
)


function App(props) {
  const [googleId, setGoogleId] = useState(null);
  const [myDanceName, setMyDanceName] = useState(null);
  const [myDanceIndex, setMyDanceIndex] = useState(null);

  const [allDancers, setAllDancers] = useState([]);
  const [modalOpen, toggleModalState] = useState(false);
  const [displayedDancer, setDancer] = useState(null);
  const [displayedPrefs, setPrefs] = useState([]);

  const [dancerList, setDancerList] = useState(null);
  const [rosteredList, setRosteredList] = useState(null);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(()=> {
    
    async function getData() {
        setIsLoading(true);
        get("/api/allDancers").then((allDancerData) => {
            setAllDancers(allDancerData);
            if (myDanceIndex) {
              get("/api/getDance", {danceId: myDanceIndex}).then((myDancerData) => {
                myDancerData.sort(function(a, b) {
                  return a[myDanceIndex] - b[myDanceIndex];
                })
                setRosteredList(myDancerData);
                const tempList = [];
                for (var i = 0; i < allDancerData.length; i++) {
                  let isMyDancer = false;
                  for (var j = 0; j < myDancerData.length; j++) {
                    if (allDancerData[i]._id == myDancerData[j]._id) {
                      isMyDancer = true;
                      break;
                    }
                  }
                  if (!isMyDancer) {
                    tempList.push(allDancerData[i]);
                  }
                }
                tempList.sort(function(a, b) {
                  return a[myDanceIndex] - b[myDanceIndex];
                })
                setDancerList(tempList);
            });
            }
            
        });
    }

    if (allDancers.length == 0 && googleId) {
        getData().then(() => {
          setIsLoading(false);
        });
    }
    else {
      get("/api/whoami").then((user) => {
        if (user.email) {
          get("/api/validChoreog", { googleid: user.googleid, gmail: user.email }).then((choreog) => {
            setGoogleId(user.email);
            setMyDanceName(choreog.dance_name);
            setMyDanceIndex(choreog.dance_index);
          })
        }
      });
    }

    socket.on("addDancerToDance", (data) => {
      let ind = -1;
      for (let i = 0; i < allDancers.length; i++) {
        if (allDancers[i]._id == data.addedDancer._id) {
          ind = i;
          break;
        }
      } 
      get("/api/getDancer", {dancerId: data.addedDancer._id}).then((updatedDancer) => {
        if (ind !== -1) {
          setAllDancers([...allDancers.slice(0, ind), updatedDancer, ...allDancers.slice(ind+1)]);
        }
      })
    })

    socket.on("removeDancerFromDance", (data) => {
      let ind = -1;
      for (let i = 0; i < allDancers.length; i++) {
        if (allDancers[i]._id == data.removedDancer._id) {
          ind = i;
          break;
        }
      } 
      get("/api/getDancer", { dancerId: data.removedDancer._id }).then((updatedDancer) => {
        if (ind !== -1) {
          setAllDancers([...allDancers.slice(0, ind), updatedDancer, ...allDancers.slice(ind+1)]);
        }
      })
    })

  }, [allDancers, googleId, myDanceIndex, myDanceName]);

  function handleLogin(res) {
    const userToken = res.tokenObj.id_token;
    post("/api/login", { token: userToken }).then((user) => {
      get("/api/validChoreog", { googleid: res.profileObj.googleId, gmail: res.profileObj.email }).then((choreog) => {
        setGoogleId(res.profileObj.email);
        console.log("Welcome choreographer " + res.profileObj.name);
        setMyDanceName(choreog.dance_name);
        setMyDanceIndex(choreog.dance_index);
      })
    });
  };

  function handleLogout() {
    setGoogleId(null);
    post("/api/logout");
  };

  function toggleModal(dancer) {
    if (modalOpen) {
        toggleModalState(false);
        setDancer(null);
        setPrefs([]);
    }
    else {
        toggleModalState(true);
        let tempPrefs = [];
        setDancer(dancer);
        tempPrefs = [ /** Change this to have actual dance names */
            [0, dancer.dance_0],
            [1, dancer.dance_1],
            [2, dancer.dance_2],
            [3, dancer.dance_3],
            [4, dancer.dance_4],
            [5, dancer.dance_5],
            [6, dancer.dance_6],
            [7, dancer.dance_7],
            [8, dancer.dance_8],
            [9, dancer.dance_9],
            [10, dancer.dance_10],
            [11, dancer.dance_11],
            [12, dancer.dance_12],
            [13, dancer.dance_13],
            [14, dancer.dance_14],
            [15, dancer.dance_15],
            [16, dancer.dance_16],
            [17, dancer.dance_17]
        ];
        tempPrefs.sort(function (a, b) {
            return a[1] - b[1];
        })
        setPrefs(tempPrefs);
    }
  }

  function addToDance(addingDancer) {
    setIsLoading(true);
    post("/api/addToDance", {danceId: myDanceIndex, danceName: myDanceName, dancer: addingDancer}).then((dancer) => {
      // get("/api/getDancer", {dancerId: addingDancer._id}).then((dancer) => {
        console.log(dancer);
        setRosteredList([ ... rosteredList, dancer]);
        const ind = dancerList.indexOf(addingDancer);
        if (ind !== -1) {
          const tempList = dancerList.slice();
          tempList.splice(ind, 1);
          setDancerList(tempList);      
          }
        const ind2 = allDancers.indexOf(addingDancer);
        if (ind2 !== -1) {
          setAllDancers([... allDancers.slice(0, ind2), dancer, ...allDancers.slice(ind2+1)]);
        }
        setIsLoading(false);
      // });
    });
  }

  function removeFromDance(removingDancer) {
    post("/api/removeFromDance", {danceId: myDanceIndex, danceName: myDanceName, dancer: removingDancer}).then((dancer) => {
      const tempDancerList = [ ... dancerList, dancer];
      tempDancerList.sort(function(a, b) {
        return a[myDanceIndex] - b[myDanceIndex];
      })
      setDancerList(tempDancerList);
      const ind = rosteredList.indexOf(removingDancer);
      if (ind !== -1) {
        const tempList = rosteredList.slice();
        tempList.splice(ind, 1);
        setRosteredList(tempList);      
      }
      const ind2 = allDancers.indexOf(removingDancer);
      if (ind2 !== -1) {
        setAllDancers([... allDancers.slice(0, ind2), dancer, ...allDancers.slice(ind2+1)]);
      }
    });
  }



    return (
      <>
      
      <NavBar 
        googleId={googleId}
        handleLogin={handleLogin}
        handleLogout={handleLogout}
      />
      <div className="appContainer">
        {googleId ? (
          <>
            <Router>
            <FullRoster 
              path="/"
              allDancers={allDancers}
              displayedDancer={displayedDancer}
              displayedPrefs={displayedPrefs}
              toggleModal={toggleModal}
            /> 
            { rosteredList && dancerList && myDanceName && myDanceIndex ? 
            <Dance path="/dance"
              rosteredList={rosteredList}
              dancerList={dancerList}
              myDanceName={myDanceName}
              myDanceIndex={myDanceIndex}
              displayedDancer={displayedDancer}
              displayedPrefs={displayedPrefs}
              toggleModal={toggleModal}
              addToDance={addToDance}
              removeFromDance={removeFromDance}/>
            : null} 
            <Admin path="/admin" />
            <NotFound default />
            </Router>
            <OnRouteChange action={() => { window.scrollTo(0, 0)}} />

            {allDancers ? 
              <div className="lds-ellipsis"><div></div><div></div><div></div><div></div></div>
            : null}
        </>
          ) : (
            <div className="App-logo-container">
              <img className="App-logo" src={logo} />
            </div>
          )}
      </div>
      
      </>
    );
}

export default App;
