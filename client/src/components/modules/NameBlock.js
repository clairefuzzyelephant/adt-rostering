import React, { useState, useEffect } from "react";
import { get, post } from "../../utilities.js";

import star from "../../public/star_icon_white.png";
import umbrella from "../../public/umbrella_icon_white.png";

import "./NameBlock.css";

function NameBlock(props) {
  const {dancer, toggleModal, onDancePage, danceRanking, addFunction, removeFunction} = props;
  const [tradVid, setTradVid] = useState(null);
  const [hiphopVid, setHiphopVid] = useState(null);

  useEffect(() => {
    get("/api/video", { email: dancer.emailAddr }).then((videoData) => {
        setTradVid(videoData.trad);
        setHiphopVid(videoData.hiphop);
    })
  }, [dancer])

  return (
    <div className="nameBlock-container">
        {onDancePage ? 
            <>
            { addFunction ? 
            <div className="nameBlock-pref-add">
                <div>{danceRanking}</div>
                <button onClick={() => {
                    addFunction(dancer)}}>Add to Dance</button>
            </div>: 
            <div className="nameBlock-pref-remove">
                <div>{danceRanking}</div>
                <button onClick={() => removeFunction(dancer)}>Remove from Dance</button>
            </div>
            }
            </>
            :
            <div className="nameBlock-auditionNum">
                {dancer.auditionNum}
            </div>
        }
        <div className="nameBlock-name">
            {dancer.firstName + (dancer.nickname !== "" ? " (" + dancer.nickname + ") " : " ") + dancer.lastName}
            {tradVid ? 
            <>
                <a href={tradVid} alt="trad" title="trad video" target="_blank"><img src={umbrella} /></a>
            </>
            : null
            }
            {hiphopVid ? 
            <>
                <a href={hiphopVid} alt="hiphop" title="hiphop video" target="_blank"><img src={star} /></a>
            </>
            : null
            }
        </div>
        <div className="nameBlock-year">
            {dancer.year}
        </div>
        <div className="nameBlock-prefs">
            <button onClick={() => toggleModal(dancer)}>View Prefs</button>
        </div>
        <div className="nameBlock-numDancesRequested">
            <>
            {dancer.rosteredDances ? dancer.rosteredDances.length + "/" + dancer.numDances : null}
            {dancer.rosteredDances.length > dancer.numDances ?
                <span className="nameBlock-warning">
                 !
                </span>
                : null}
            </>
        </div>
        <div className="nameBlock-rosteredDancesContainer">
            <>
            {dancer.rosteredDances ? 
            dancer.rosteredDances.slice(0, dancer.rosteredDances.length-1).map((dance) => 
                dance + ", "
            ):
            null}
            {dancer.rosteredDances[dancer.rosteredDances.length-1]}
            </>
        </div>
    </div>
  );
}

export default NameBlock;