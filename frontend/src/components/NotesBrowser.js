import { useState, useEffect } from 'react';

export default function NotesBrowser({ apiBase }) {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchNotes = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${apiBase}/api/notes`);
            
            if (response.ok) {
                const data = await response.json();
                setNotes(data);
            } else if (response.status === 404) {
                setNotes([]); // No files found
            } else {
                throw new Error('Failed to fetch notes list.');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchNotes();
    }, [apiBase]);
    
    const handleDownload = (fileId) => {
        // Opens the download route in a new tab
        window.open(`${apiBase}/api/notes/${fileId}`, '_blank');
    };

    if (loading) return <p>Loading notes...</p>;
    if (error) return <p className="text-red-500">Error: {error}</p>;

    return (
        <div className="p-4 border rounded-lg shadow-md">
            <h3 className="text-md font-semibold mb-3">Browse Saved Notes ({notes.length})</h3>
            
            <button onClick={fetchNotes} className="text-sm text-purple-600 hover:underline mb-3">
                Refresh List
            </button>

            {notes.length === 0 ? (
                <p>No notes have been saved yet. Upload one above!</p>
            ) : (
                <ul className="space-y-2 max-h-60 overflow-y-auto">
                    {notes.map(note => (
                        <li key={note._id} className="flex justify-between items-center p-2 border rounded-md bg-gray-50">
                            <span className="truncate pr-2">{note.metadata?.originalName || note.filename}</span>
                            <button 
                                onClick={() => handleDownload(note._id)}
                                className="text-blue-600 hover:underline text-sm flex-shrink-0"
                            >
                                View/Download
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}