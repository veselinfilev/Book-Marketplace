import React from 'react';
import styles from './DeleteModal.module.css';

const DeleteModal = ({ onDelete, bookId, onClose }) => {
    const handleDelete = () => {
        onDelete(bookId);
        onClose();
    };

    return (
        <div className={styles.modal}>
            <div className={styles.modalContent}>
                <p>Are you sure you want to delete this book?</p>
                <button onClick={handleDelete}>Yes</button>
                <button onClick={onClose}>Cancel</button>
            </div>
        </div>
    );
};

export default DeleteModal;