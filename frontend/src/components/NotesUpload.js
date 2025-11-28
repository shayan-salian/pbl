import { useState } from 'react';

export default function NotesUpload({ apiBase }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState('');

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
        setUploadStatus('');
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setUploadStatus('Please select a file first.');
            return;
        }

        setUploadStatus('Uploading...');
        
        const formData = new FormData();
        formData.append('file', selectedFile); 
        
        try {
            const response = await fetch(`${apiBase}/api/notes/upload`, {
                method: 'POST',
                body: formData, 
            });

            if (response.ok) {
                const data = await response.json();
                setUploadStatus(`Success! File ID: ${data.fileId}. Refresh list to see it.`);
                setSelectedFile(null); 
            } else {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                setUploadStatus(`Upload failed: ${errorData.message}`);
            }
        } catch (error) {
            console.error('Upload Error:', error);
            setUploadStatus('Network or server connection error.');
        }
    };

    return (
        <div className="p-4 border rounded-lg shadow-md mb-6">
            <h3 className="text-md font-semibold mb-3">Upload New Note</h3>
            <input 
                type="file" 
                accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange} 
                className="mb-3 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer"
            />
            
            <button 
                onClick={handleUpload} 
                disabled={!selectedFile || uploadStatus === 'Uploading...'}
                className="btn-primary"
            >
                {uploadStatus === 'Uploading...' ? 'Uploading...' : 'Save Note'}
            </button>
            
            {uploadStatus && (
                <p className={`mt-2 text-sm ${uploadStatus.includes('Success') ? 'text-green-600' : 'text-red-600'}`}>
                    Status: {uploadStatus}
                </p>
            )}
        </div>
    );
}