import React, { useState, useEffect } from "react";
import "./NavBar.css";
import { Link } from "@reach/router";
import GoogleLogin, { GoogleLogout } from "react-google-login";


const GOOGLE_CLIENT_ID = "7112847294-5v026crn1ac038njg41v8a4e6obaeaae.apps.googleusercontent.com";



function NavBar(props) {
  const {googleId, handleLogin, handleLogout} = props;
  
  const [pathName, setPathName] = useState("/");

  const isActive = () => {
    setPathName(window.location.pathname);
  }

  return (
    <div className="NavBar-container">
        {googleId ? 
        <>
            <div className="NavBar-linksContainer">
              <div className="NavBar-linkBlock">
                <Link getProps={isActive} to="/" className="NavBar-link">
                    Roster
                </Link>
                <div>{pathName === "/" ? "^" : null}</div>
              </div>
              <div className="NavBar-linkBlock">
                <Link getProps={isActive} to="/allDances" className="NavBar-link">
                    All Dances
                </Link>
                <div>{pathName === "/allDances" ? "^" : null}</div>
              </div>
              <div className="NavBar-linkBlock">
                <Link getProps={isActive} to="/dance" className="NavBar-link">
                    My Dance
                </Link>
                <div>{pathName === "/dance" ? "^" : null}</div>
              </div>
            </div>
            <GoogleLogout
                clientId={GOOGLE_CLIENT_ID}
                buttonText="Logout"
                onLogoutSuccess={handleLogout}
                onFailure={(err) => console.log(err)}
                className="NavBar-link NavBar-login"
            />
        </>
        :
            <GoogleLogin
              clientId={GOOGLE_CLIENT_ID}
              buttonText="Login"
              onSuccess={handleLogin}
              onFailure={(err) => console.log(err)}
              className="NavBar-link NavBar-login"
            />
    }
    </div>
  );
}

export default NavBar;