export default function Login() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Logga in</h1>
      <form>
        <div>
          <label htmlFor='email'>E-post:</label>
          <input type='email' id='email' name='email' required />
        </div>
        <div>
          <label htmlFor='password'>Lösenord:</label>
          <input type='password' id='password' name='password' required />
        </div>
        <button type='submit'>Logga in</button>
      </form>
    </div>
  );
}
