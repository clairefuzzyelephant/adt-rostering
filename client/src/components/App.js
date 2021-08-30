import React, { useState, useEffect } from "react";
import { Router, Location } from "@reach/router";
import { get, post } from "../utilities.js";
import NotFound from "./pages/NotFound.js";
import NavBar from "./modules/NavBar.js";
import Dance from "./pages/Dance.js";
import Admin from "./pages/Admin.js";
import FullRoster from "./pages/FullRoster.js";
import AllDances from "./pages/AllDances.js";
import Scheduling from "./pages/Scheduling.js";

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
  const [name, setName] = useState(null);
  const [myDanceName, setMyDanceName] = useState(null);
  const [myDanceIndex, setMyDanceIndex] = useState(null);
  const [myStyle, setMyStyle] = useState(null);

  // const [sortedDancers, setSortedDancers] = useState([]);
  const [sortedDancers, setSortedDancers] = useState(null);
  const [modalOpen, toggleModalState] = useState(false);
  const [displayedDancer, setDancer] = useState(null);
  const [displayedPrefs, setPrefs] = useState([]);

  const [dancerList, setDancerList] = useState(null); // dancers that are NOT rostered into my dance
  const [rosteredList, setRosteredList] = useState(null); // dancers that are rostered into my dance

  useEffect(()=> {
    async function getData() {
        get("/api/allDancers").then((allDancerData) => {
          const tempDancers = allDancerData.slice();
          tempDancers.sort(function(a, b) {
            let a_load;
            let b_load;
            try {
              a_load = a.rosteredDances.length;
            }
            catch {
              a_load = 0;
            }
            try {
              b_load = b.rosteredDances.length;
            }
            catch {
              b_load = 0;
            }
            return a_load - b_load;  
            })
            setSortedDancers(tempDancers);
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

    if (!sortedDancers && googleId) {
        getData();
    }
    else {
      get("/api/whoami").then((user) => {
        if (user.email) {
          get("/api/validChoreog", { googleid: user.googleid, gmail: user.email }).then((choreog) => {
            setGoogleId(user.email);
            setName(user.name);
            setMyDanceName(choreog.dance_name);
            setMyDanceIndex(choreog.dance_index);
            setMyStyle(choreog.style);
          })
        }
      });
    }

  }, [googleId, myDanceIndex, myDanceName, myStyle]);

  function updateDanceSpecificData(updatedDancer, updatedDance, isAdding) {
    if (updatedDance !== myDanceName) {
      if (rosteredList) {
        for (let i = 0; i < rosteredList.length; i++) {
          if (rosteredList[i]._id.toString() == updatedDancer._id.toString()) {
            setRosteredList([...rosteredList.slice(0, i), updatedDancer, ...rosteredList.slice(i+1)]);
            break;
          }
        }
      }
      if (dancerList) {
        for (let i = 0; i < dancerList.length; i++) {
          if (dancerList[i]._id.toString() == updatedDancer._id.toString()) {
            setDancerList([...dancerList.slice(0, i), updatedDancer, ...dancerList.slice(i+1)]);
            break;
          }
        }
      }
    }
    else {
      if (isAdding) {
        if (dancerList) {
          for (let i = 0; i < dancerList.length; i++) {
            if (dancerList[i]._id.toString() == updatedDancer._id.toString()) {
              setDancerList([...dancerList.slice(0, i), ...dancerList.slice(i+1)]);
              break;
            }
          }
          setRosteredList([...rosteredList.slice(), updatedDancer]);
        }
      }
      else {
        if (rosteredList && myDanceIndex) {
          for (let i = 0; i < rosteredList.length; i++) {
            if (rosteredList[i]._id.toString() == updatedDancer._id.toString()) {
              setRosteredList([...rosteredList.slice(0, i), ...rosteredList.slice(i+1)]);
              break;
            }
          }
          const tempList = [...dancerList, updatedDancer];
          tempList.sort(function(a, b) {
            return a[myDanceIndex] - b[myDanceIndex];
          })
          setDancerList(tempList);
        }
      }
    }
  }
  

  useEffect(() => {
    socket.once("addDancerToDance", (data) => {
      console.log(data.name + " making changes");
      if (data.name !== name) {
        let ind = -1;
        for (let i = 0; i < sortedDancers.length; i++) {
          if (sortedDancers[i]._id.toString() == data.addedDancer._id.toString()) {
            ind = i;
            break;
          }
        } 
        get("/api/getDancer", {dancerId: data.addedDancer._id}).then((updatedDancer) => {
          if (ind !== -1) {
            setSortedDancers([...sortedDancers.slice(0, ind), updatedDancer, ...sortedDancers.slice(ind+1)]);
            updateDanceSpecificData(updatedDancer, data.danceName, true);
          }
        })
      }
    })
    return () => {
      socket.off("addDancerToDance");
    }
  })
  
  useEffect(() => {
    socket.once("removeDancerFromDance", (data) => {
      if (data.name !== name) {
        let ind = -1;
        for (let i = 0; i < sortedDancers.length; i++) {
          if (sortedDancers[i]._id == data.removedDancer._id) {
            ind = i;
            break;
          }
        } 
        get("/api/getDancer", { dancerId: data.removedDancer._id }).then((updatedDancer) => {
          if (ind !== -1) {
            setSortedDancers([...sortedDancers.slice(0, ind), updatedDancer, ...sortedDancers.slice(ind+1)]);
            updateDanceSpecificData(updatedDancer, data.danceName, false);
          }
        })
      }
    })
    return () => {
      socket.off("removeDancerFromDance");
    }
  })

  function handleLogin(res) {
    const userToken = res.tokenObj.id_token;
    post("/api/login", { token: userToken }).then((user) => {
      get("/api/validChoreog", { googleid: res.profileObj.googleId, gmail: res.profileObj.email }).then((choreog) => {
        setGoogleId(res.profileObj.email);
        setName(res.profileObj.name);
        console.log("Welcome choreographer " + res.profileObj.name);
        setMyDanceName(choreog.dance_name);
        setMyDanceIndex(choreog.dance_index);
        setMyStyle(choreog.style);
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
        tempPrefs = [
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
    post("/api/addToDance", {choreogName: name, danceId: myDanceIndex, danceName: myDanceName, dancer: addingDancer, style: myStyle}).then((dancer) => {
      setRosteredList([ ...rosteredList, dancer]);
      const ind = dancerList.indexOf(addingDancer);
      if (ind !== -1) {
        setDancerList([...dancerList.slice(0, ind), ...dancerList.slice(ind+1)])   
      }
      let ind2 = -1;
      for (let d of sortedDancers) {
        if (d._id == addingDancer._id) {
          ind2 = sortedDancers.indexOf(d);
          break;
        }
      }
      if (ind2 !== -1) {
        setSortedDancers([... sortedDancers.slice(0, ind2), dancer, ...sortedDancers.slice(ind2+1)]);
      }
    });
  }

  function removeFromDance(removingDancer) {
    post("/api/removeFromDance", {choreogName: name, danceId: myDanceIndex, danceName: myDanceName, dancer: removingDancer}).then((dancer) => {
      const tempDancerList = [ ...dancerList, dancer];
      tempDancerList.sort(function(a, b) {
        return a[myDanceIndex] - b[myDanceIndex];
      })
      setDancerList(tempDancerList);
      const ind = rosteredList.indexOf(removingDancer);
      if (ind !== -1) {
        setRosteredList([...rosteredList.slice(0, ind), ...rosteredList.slice(ind+1)]);
      }
      let ind2 = -1;
      for (let d of sortedDancers) {
        if (d._id == removingDancer._id) {
          ind2 = sortedDancers.indexOf(d);
          break;
        }
      }
      if (ind2 !== -1) {
        setSortedDancers([... sortedDancers.slice(0, ind2), dancer, ...sortedDancers.slice(ind2+1)]);
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
            {sortedDancers ? 
            <FullRoster 
              path="/"
              allDancers={sortedDancers}
              displayedDancer={displayedDancer}
              displayedPrefs={displayedPrefs}
              toggleModal={toggleModal}
            /> : null}
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
            <AllDances path="/allDances" />
            <Scheduling path="/scheduling" rosteredList={rosteredList} choreogName={name}/>
            <Admin path="/admin" />
            <NotFound default />
            </Router>
            <OnRouteChange action={() => { window.scrollTo(0, 0)}} />

            {!sortedDancers ? 
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
