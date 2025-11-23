import React, { useState, useCallback } from 'react';
import { Upload, FileText, Loader2, CheckCircle } from 'lucide-react';
import axios from 'axios';

const UploadZone = ({ onUploadComplete }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, success, error

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    }, []);

    const handleDrop = useCallback(async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = [...e.dataTransfer.files];
        if (files.length > 0) {
            await uploadFile(files[0]);
        }
    }, []);

    const handleFileInput = async (e) => {
        const files = [...e.target.files];
        if (files.length > 0) {
            await uploadFile(files[0]);
        }
    };

    const uploadFile = async (file) => {
        setIsUploading(true);
        setUploadStatus('uploading');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post('http://localhost:8000/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('Upload success:', response.data);
            setUploadStatus('success');
            if (onUploadComplete) onUploadComplete(response.data.filename);
        } catch (error) {
            console.error('Upload failed:', error);
            setUploadStatus('error');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto mb-8">
            <div
                className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 ease-in-out text-center cursor-pointer
          ${isDragging
                        ? 'border-accent bg-accent/5'
                        : 'border-slate-300 hover:border-accent/50 hover:bg-slate-50'
                    }
          ${uploadStatus === 'success' ? 'border-green-500 bg-green-50' : ''}
        `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('fileInput').click()}
            >
                <input
                    type="file"
                    id="fileInput"
                    className="hidden"
                    onChange={handleFileInput}
                    accept=".pdf,.txt"
                />

                <div className="flex flex-col items-center justify-center space-y-4">
                    <div className={`p-4 rounded-full ${uploadStatus === 'success' ? 'bg-green-100' : 'bg-slate-100'}`}>
                        {isUploading ? (
                            <Loader2 className="w-8 h-8 text-accent animate-spin" />
                        ) : uploadStatus === 'success' ? (
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        ) : (
                            <Upload className="w-8 h-8 text-slate-400" />
                        )}
                    </div>

                    <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-slate-900">
                            {isUploading ? 'Uploading...' : uploadStatus === 'success' ? 'Document Uploaded!' : 'Upload Knowledge Base'}
                        </h3>
                        <p className="text-sm text-slate-500">
                            {uploadStatus === 'success'
                                ? 'Ready to generate research'
                                : 'Drag & drop your PDF or Text file here, or click to browse'
                            }
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UploadZone;
