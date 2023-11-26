import styles from "./Profile.module.css"
import { Link } from "react-router-dom";
import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from "../../contexts/AuthContext";
import { currentUserBooks } from "../../services/buyService";

const ProfilePage = () => {

  const { username, userEmail, userId } = useContext(AuthContext);

  const [purchasedItems, setPurchasedItems] = useState([])

  useEffect(() => {
    currentUserBooks(userId)
      .then(result => setPurchasedItems(result.map(i => i.book)))
  }, [])

  return (
    <div className={styles.profilePage}>
      <div className={styles.userInfo}>
        <h2>Profile Info</h2>
        <p>Name: {username}</p>
        <p>Email: {userEmail}</p>
      </div>
      <h3 className={styles.purchase}>Purchased Items</h3>
        {purchasedItems.length===0 && (
          <p className={styles.noPurchase}>No purchased items yet &#128577;</p>
        )}
      <div className={styles.purchasedItems}>
        {purchasedItems && (

          purchasedItems.map((item) => (
            <div key={item._id} className={styles.item}>
              <img src={item.image} alt={item.name} />
              <div className={styles.itemDetails}>
                <h4>{item.name}</h4>
                <p>Author: {item.author}</p>
                <p>Price: ${item.price}</p>
                <Link to={`/details/${item._id}`}><button> Detail</button></Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
