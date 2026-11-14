import React, { useContext, useState } from 'react'
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router-dom'
import "../App.css";
import { Alert, Button, IconButton, TextField } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import { AuthContext } from '../contexts/AuthContext';

function HomeComponent() {


    let navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");
    const [historyError, setHistoryError] = useState("");
    const [savingMeeting, setSavingMeeting] = useState(false);

    const {addToUserHistory} = useContext(AuthContext);
    const handleJoinVideoCall = async () => {
        const code = meetingCode.trim();
        if (!code) {
            setHistoryError("Enter a meeting code to continue.");
            return;
        }

        setSavingMeeting(true);
        setHistoryError("");
        try {
            await addToUserHistory(code);
            navigate(`/${code}`);
        } catch (error) {
            setHistoryError(
                error.response?.data?.message ||
                "Could not save this meeting to your history. Please sign in again and retry."
            );
        } finally {
            setSavingMeeting(false);
        }
    }

    return (
        <>

            <div className="navBar">

                <div style={{ display: "flex", alignItems: "center" }}>

                    <h2>Apna Video Call</h2>
                </div>

                <div style={{ display: "flex", alignItems: "center" }}>
                    <IconButton onClick={
                        () => {
                            navigate("/history")
                        }
                    }>
                        <RestoreIcon />
                    </IconButton>
                    <p>History</p>

                    <Button onClick={() => {
                        localStorage.removeItem("token")
                        navigate("/auth")
                    }}>
                        Logout
                    </Button>
                </div>


            </div>


            <div className="meetContainer">
                <div className="leftPanel">
                    <div>
                        <h2>Providing Quality Video Call Just Like Quality Education</h2>

                        <div style={{ display: 'flex', gap: "10px" }}>

                            <TextField onChange={e => setMeetingCode(e.target.value)} id="outlined-basic" label="Meeting Code" variant="outlined" />
                            <Button onClick={handleJoinVideoCall} variant='contained' disabled={savingMeeting}>
                                {savingMeeting ? "Joining..." : "Join"}
                            </Button>

                        </div>
                        {historyError && <Alert severity="error" sx={{ mt: 2 }}>{historyError}</Alert>}
                    </div>
                </div>
                <div className='rightPanel'>
                    <img srcSet='/logo3.png' alt="" />
                </div>
            </div>
        </>
    )
}


export default withAuth(HomeComponent)