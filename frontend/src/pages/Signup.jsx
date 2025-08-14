export default function Signup() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Skapa konto</h1>
      <form>
        <div>
          <label htmlFor='name'>Namn:</label>
          <input type='text' id='name' name='name' required />
        </div>
        <div>
          <label htmlFor='email'>E-post:</label>
          <input type='email' id='email' name='email' required />
        </div>
        <div>
          <label htmlFor='password'>Lösenord:</label>
          <input type='password' id='password' name='password' required />
        </div>
        <button type='submit'>Skapa konto</button>
      </form>
    </div>
  );
}
