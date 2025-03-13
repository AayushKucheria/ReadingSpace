import React, { useState } from 'react';
import { apiUploadLibrary } from '../services/api';
import '../styles/BookUpload.css';

export const BookUpload = ({ onBooksUploaded }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setError(null);
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError('Please upload a CSV file.');
      }
    }
  };
  
  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }
    
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file.');
      return;
    }
    
    setUploading(true);
    setError(null);
    
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 10;
        return newProgress > 90 ? 90 : newProgress;
      });
    }, 500);
    
    try {
      const response = await apiUploadLibrary(file);
      clearInterval(progressInterval);
      setProgress(100);
      
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
        onBooksUploaded(response.books);
      }, 500);
      
    } catch (error) {
      clearInterval(progressInterval);
      setUploading(false);
      setProgress(0);
      setError(error.message || 'Failed to upload library. Please try again.');
    }
  };
  
  return (
    <div className="book-upload">
      <h2>Upload Your Goodreads Library</h2>
      
      <div className="upload-instructions">
        <h3>How to export your Goodreads library:</h3>
        <ol>
          <li>Go to <a href="https://www.goodreads.com/review/import" target="_blank" rel="noopener noreferrer">Goodreads</a></li>
          <li>Click on "Export Library" at the bottom of the page</li>
          <li>Wait for the email from Goodreads with your export</li>
          <li>Download the CSV file and upload it here</li>
        </ol>
      </div>
      
      <div 
        className="upload-area"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          id="file-upload" 
          onChange={handleFileChange}
          accept=".csv"
          disabled={uploading}
        />
        <label htmlFor="file-upload">
          {file ? file.name : 'Choose your Goodreads CSV file or drag it here'}
        </label>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {uploading && (
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
          <div className="progress-text">
            {progress < 100 ? 'Processing library...' : 'Complete!'}
          </div>
        </div>
      )}
      
      <button 
        className="upload-button"
        onClick={handleUpload}
        disabled={!file || uploading}
      >
        {uploading ? 'Uploading...' : 'Upload Library'}
      </button>
    </div>
  );
}; 