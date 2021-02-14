import React, { useState, useEffect } from "react";

import { MsalProvider, AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from "@azure/msal-react";
import { PublicClientApplication, EventType, InteractionType } from "@azure/msal-browser";

import { b2cPolicies } from "./policies";
import { msalConfig } from "./authConfig";
import { PageLayout, IdTokenClaims } from "./ui.jsx";

import Button from "react-bootstrap/Button";
import "./styles/App.css";

const IdTokenContent = () => {
    /**
     * useMsal is hook that returns the PublicClientApplication instance, 
     * an array of all accounts currently signed in and an inProgress value 
     * that tells you what msal is currently doing.
     */
    const { accounts } = useMsal();
    const [idTokenClaims, setIdTokenClaims] = useState(null);

    function GetIdTokenClaims() {
        setIdTokenClaims(accounts[0].idTokenClaims)
    }

    return (
        <>
            <h5 className="card-title">Welcome {accounts[0].name}</h5>
            {idTokenClaims ?
                <IdTokenClaims idTokenClaims={idTokenClaims} />
                :
                <Button variant="secondary" onClick={GetIdTokenClaims}>View ID Token Claims</Button>
            }
        </>
    );
};

/**
 * Most applications will need to conditionally render certain components based on whether a user is signed in or not. 
 * msal-react provides 2 easy ways to do this. AuthenticatedTemplate and UnauthenticatedTemplate components will 
 * only render their children if a user is authenticated or unauthenticated, respectively.
 */
const MainContent = () => {

    const { instance } = useMsal();
	
    /**
     * Using the event API, you can register an event callback that will do something when an event is emitted. 
     * When registering an event callback in a react component you will need to make sure you do 2 things.
     * 1) The callback is registered only once
     * 2) The callback is unregistered before the component unmounts.
     */
    useEffect(() => {
		const callbackId = instance.addEventCallback((event) => {
			if (event.eventType === EventType.LOGIN_FAILURE) {
				if (event.error && event.error.errorMessage.indexOf("AADB2C90118") > -1) {
					if (event.interactionType === InteractionType.Redirect) {
						instance.loginRedirect(b2cPolicies.authorities.forgotPassword);
					} else if (event.interactionType === InteractionType.Popup) {
						instance.loginPopup(b2cPolicies.authorities.forgotPassword)
                            .catch(e => {
                                return;
                            });
					}
				}
			}
		});

		return () => {
			if (callbackId) {
				instance.removeEventCallback(callbackId);
			}
		};
	}, []);

    return (
        <div className="App">
            <AuthenticatedTemplate>
                <IdTokenContent />
            </AuthenticatedTemplate>

            <UnauthenticatedTemplate>
                <h5 className="card-title">Please sign-in to see your profile information.</h5>
            </UnauthenticatedTemplate>
        </div>
    );
};

/**
 * msal-react is built on the React context API and all parts of your app that require authentication must be 
 * wrapped in the MsalProvider component. You will first need to initialize an instance of PublicClientApplication 
 * then pass this to MsalProvider as a prop. All components underneath MsalProvider will have access to the 
 * PublicClientApplication instance via context as well as all hooks and components provided by msal-react
 */
export default function App() {
    const msalInstance = new PublicClientApplication(msalConfig);

    return (
        <MsalProvider instance={msalInstance}>
            <PageLayout>
                <MainContent />
            </PageLayout>
        </MsalProvider>
    );
}
