"use client";

import { LiveDataMap } from "~app/live/live.types";
import { useEffect, useState } from "react";
import { useReconnectWebsocket } from "~src/components/websocket/use-reconnect-websocket";
import { liveRunArrayToMap } from "~app/live/utilities";
import MarathonRun from "~src/components/marathon/marathon-run";
import { Col, Row } from "react-bootstrap";

export default function ShowMarathon({
    liveDataMap,
    session,
}: {
    liveDataMap: LiveDataMap;
    session: any;
}) {
    const [updatedLiveDataMap, setUpdatedLiveDataMap] = useState(liveDataMap);
    const [selectedUser, setSelectedUser] = useState("");
    const [currentUserData, setCurrentUserData] = useState();

    const lastMessage = useReconnectWebsocket();

    useEffect(() => {
        if (lastMessage !== null) {
            const data = JSON.parse(lastMessage.data);
            const user = data.user;
            let newMap: LiveDataMap = JSON.parse(
                JSON.stringify(updatedLiveDataMap)
            );

            if (data.type == "UPDATE") {
                newMap[user] = data.run;
            }

            if (data.type == "DELETE") {
                delete newMap[user];
            }

            newMap = liveRunArrayToMap(Object.values(newMap));

            setUpdatedLiveDataMap(newMap);
        }
    }, [lastMessage]);

    useEffect(() => {
        if (updatedLiveDataMap[selectedUser]) {
            setCurrentUserData(updatedLiveDataMap[selectedUser]);
        } else {
            setCurrentUserData(undefined);
        }
    }, [selectedUser, updatedLiveDataMap]);

    if (!session.username) {
        return <div>Please login to use this feature.</div>;
    }

    if (!currentUserData && !selectedUser) {
        return (
            <>
                <BasePage
                    selectedUser={selectedUser}
                    setSelectedUser={setSelectedUser}
                    updatedLiveDataMap={updatedLiveDataMap}
                />
                <p className="text-center mt-3">
                    Please select or type a username to begin.
                </p>
            </>
        );
    }

    if (
        (!currentUserData || !currentUserData.gameData) &&
        !!selectedUser &&
        selectedUser.length > 0
    ) {
        return (
            <>
                <BasePage
                    selectedUser={selectedUser}
                    setSelectedUser={setSelectedUser}
                    updatedLiveDataMap={updatedLiveDataMap}
                />
                <p className="text-center mt-3">
                    Waiting for user data to become available... Please try a
                    reset, which will upload the data.
                </p>
            </>
        );
    }

    return (
        <>
            <BasePage
                selectedUser={selectedUser}
                setSelectedUser={setSelectedUser}
                updatedLiveDataMap={updatedLiveDataMap}
            />
            <hr />
            {currentUserData.gameData && (
                <MarathonRun runData={currentUserData} session={session} />
            )}
        </>
    );
}

const BasePage = ({ selectedUser, setSelectedUser, updatedLiveDataMap }) => {
    return (
        <div className="text-center">
            <h1>Marathon Dashboard</h1>
            <Row>
                <Col md={6} className="mb-3 m-md-0">
                    <label htmlFor={"selectMarathonUser"}>Select a user:</label>
                    <select
                        className="form-select"
                        value={selectedUser}
                        id={"selectMarathonUser"}
                        onChange={(e) => {
                            setSelectedUser(e.target.value);
                        }}
                    >
                        <option key={""}>Select a user</option>
                        {Object.keys(updatedLiveDataMap).map((key) => {
                            return <option key={key}>{key}</option>;
                        })}
                    </select>
                </Col>
                <Col md={6}>
                    <label htmlFor={"searchBox"}>Or poll for user:</label>
                    <input
                        type="search"
                        className="form-control"
                        placeholder="Poll for a user"
                        onChange={async (e) => {
                            setSelectedUser(e.target.value);
                        }}
                        value={selectedUser}
                        id="searchBox"
                    />
                </Col>
            </Row>
        </div>
    );
};
