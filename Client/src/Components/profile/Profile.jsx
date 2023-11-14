import styles from "./Profile.module.css"
import { Link } from "react-router-dom";
import React from 'react';

const ProfilePage = () => {
  const userData = {
    username: 'john_doe',
    email: 'john@example.com',
  };

  const purchasedItems = [
    {
      id: 1,
      name: 'Book 1',
      author: 'Author 1',
      price: 20.00,
      image: 'https://www.google.bg/imgres?imgurl=https%3A%2F%2Fplatinumlist.net%2Fguide%2Fwp-content%2Fuploads%2F2023%2F03%2F8359_img_worlds_of_adventure-big1613913137.jpg-1024x683.webp&tbnid=Bz3J24JVz5OCIM&vet=12ahUKEwjjq_W4rsSCAxUcgP0HHcMxCiQQMygIegQIARBc..i&imgrefurl=https%3A%2F%2Fplatinumlist.net%2Fguide%2Feverything-you-need-to-know-about-img-worlds-of-adventure&docid=A0w5ojTkCPUH_M&w=1024&h=683&q=img&ved=2ahUKEwjjq_W4rsSCAxUcgP0HHcMxCiQQMygIegQIARBc',
    },
    {
      id: 2,
      name: 'Book 2',
      author: 'Author 2',
      price: 15.00,
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTUbDCxqM2Qtr3mmn7H_O3ojGOoo0xKwj1nQg&usqp=CAU',
    },
  ];

  return (
    <div className={styles.profilePage}>
      <div className={styles.userInfo}>
        <h2>Profile Info</h2>
        <p>Name: {userData.username}</p>
        <p>Email: {userData.email}</p>
      </div>

        <h3 className={styles.purchase}>Purchased Items</h3>
      <div className={styles.purchasedItems}>
        {purchasedItems.map((item) => (
          <div key={item.id} className={styles.item}>
            <img src={item.image} alt={item.name} />
            <div className={styles.itemDetails}>
              <h4>{item.name}</h4>
              <p>Author: {item.author}</p>
              <p>Price: ${item.price}</p>
              <Link to={`/details/${item.id}`}><button> Detail</button></Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfilePage;
