import React, { useContext, useEffect, useState } from 'react'
import { Alert, IconButton } from '@mui/material';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import HomeIcon from '@mui/icons-material/Home';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export default function History() {
    const { getHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const routeTo = useNavigate();

    useEffect(() => {
        let isMounted = true;
        getHistoryOfUser()
            .then((history) => {
                if (!Array.isArray(history)) {
                    throw new Error("The server returned invalid history data.");
                }
                if (isMounted) setMeetings(history);
            })
            .catch((requestError) => {
                if (isMounted) {
                    setError(
                        requestError.response?.data?.message ||
                        requestError.message ||
                        "Failed to load meeting history."
                    );
                }
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [getHistoryOfUser]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    return (
        <div style={{ padding: "24px" }}>
            <IconButton aria-label="Back to home" onClick={() => routeTo("/home")}>
                <HomeIcon />
            </IconButton>
            <Typography component="h1" variant="h4" sx={{ mb: 2 }}>
                Meeting history
            </Typography>
            {loading && <Typography>Loading history...</Typography>}
            {!loading && error && <Alert severity="error">{error}</Alert>}
            {!loading && !error && meetings.length === 0 && (
                <Typography>No meetings yet. Join a meeting to create history.</Typography>
            )}
            {!loading && !error && meetings.map((meeting) => (
                <Card key={meeting._id} variant="outlined" sx={{ mb: 1 }}>
                    <CardContent>
                        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                            Code: {meeting.meetingCode}
                        </Typography>
                        <Typography sx={{ mb: 1.5 }} color="text.secondary">
                            Date: {formatDate(meeting.date)}
                        </Typography>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
