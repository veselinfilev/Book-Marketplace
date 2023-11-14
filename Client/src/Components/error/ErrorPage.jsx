import styles from './ErrorPage.module.css';

function ErrorPage() {
    return (
      <div className={styles.errorPage}>
        <div className={styles.errorContent}>
          <h1>Error 404</h1>
          <p>Sorry, the page you are looking for could not be found.</p>
          <p>Please check the link or return to the home page.</p>
        </div>
      </div>
    );
  }
  
  export default ErrorPage;