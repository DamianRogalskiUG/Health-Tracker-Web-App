'use client'
import React, { useEffect, useState } from "react";
import styles from "./page.module.css";
import { useFormik } from "formik";
import Cookie from "js-cookie";
import mqtt from "mqtt";
import { toast } from "react-toastify";
import * as Yup from "yup";


export default function Home() {
  const validationSchema = Yup.object({
    email: Yup.string().email('Invalid email address').required('Email is required'),
    password: Yup.string().required('Password is required'),
  });

  const [client, setClient] = useState(null);
  const [user, setUser] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [users, setUsers] = useState([]);

  const formikGetUsers = useFormik({
    initialValues: {
      email: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      const res = await fetch("http://localhost:4000/users", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        const data = await res.json();
        console.log(data);
        setUsers(data);
        alert('Pobrano dane');
      } else {
        alert('Błąd pobierania danych');
      }
    }
  });

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      const res = await fetch("http://localhost:4000/login", { 
        method: "POST",
        body: JSON.stringify(values),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        const data = await res.json();
        Cookie.set("token", data.token);
        alert('Zalogowano');
        setUser(data);
        client.publish('user/login', 'User logged in successfully', { qos: 0, retain: false });
      } else {
        alert('Błąd logowania');
      }
    },
  });

  const formikRegister = useFormik({
    initialValues: {
      email: "",
      password: "",
      passwordConfirm: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      const res = await fetch("http://localhost:4000/register", { 
        method: "POST",
        body: JSON.stringify(values),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        const data = await res.json();
        alert('Zarejestrowano');
        client.publish('user/register', 'User registered in successfully', { qos: 0, retain: false });
        setUser(data);
      } else {
        alert('Błąd rejestracji');
      }
    },
  });

  const formikLogout = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    onSubmit: async (values) => {
      const res = await fetch("http://localhost:4000/logout", { 
        method: "POST",
        body: JSON.stringify(values),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        const data = await res.json();
        Cookie.set("token", data.token);
        alert('Wylogowano');
        client.publish('user/logout', 'User logged out successfully', { qos: 0, retain: false });
        setUser(null);
      }
    },
  });
  const formikChat = useFormik({
    initialValues: {
      message: "",
    },
    validationSchema: Yup.object({
      message: Yup.string().required('Message is required'),
    }),
    onSubmit: (values) => {
      if (client) {
        client.publish('chat/messages', JSON.stringify({ user, message: values.message }), { qos: 0, retain: false });
      
      }
    },
  });
  const formikUserPatch = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      const res = await fetch("http://localhost:4000/users", {
        method: "PATCH",
        body: JSON.stringify(values),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        const data = await res.json();
        alert('Zmieniono dane');
        setUser(data);
      } else {
        alert('Błąd zmiany danych');
      }
    }
  });
  const formikUserDelete = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      const res = await fetch("http://localhost:4000/users", {
        method: "DELETE",
        body: JSON.stringify(values),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          alert('Usunięto konto');
        } else {
          alert('Błąd przy usuwaniu konta');
        }
        setUser(data);
      } else {
        alert('Błąd przy usuwaniu konta');
      }
    }
  });


  useEffect(() => {
    if (client) {
      client.subscribe('chat/messages', { qos: 0 });
    }
  }, [client]);

  useEffect(() => {
    if (client) {
      client.on('message', (topic, message) => {
        if (topic === 'chat/messages') {
          const newMessage = JSON.parse(message.toString());
          console.log(newMessage)
          setChatMessages((prevMessages) => [...prevMessages, newMessage]);
        }
      });
    }
  }, [client]);


  useEffect(() => {
    const clientId = 'mqttjs_' + Math.random().toString(16).substr(2, 8);
    const host = 'ws://broker.emqx.io:8083/mqtt';
    const options = {
      keepalive: 60,
      clientId: clientId,
      protocolId: 'MQTT',
      protocolVersion: 4,
      clean: true,
      reconnectPeriod: 1000,
      connectTimeout: 30 * 1000,
      will: {
        topic: 'WillMsg',
        payload: 'Connection Closed abnormally..!',
        qos: 0,
        retain: false
      },
    };

    console.log('Connecting mqtt client');
    const client = mqtt.connect(host, options);

    client.on('error', (err) => {
      console.log('Connection error: ', err);
      client.end();
    });

    client.on('reconnect', () => {
      console.log('Reconnecting...');
    });

    client.on('connect', () => {
      console.log(`Client connected: ${clientId}`);
      
      client.subscribe('user/login', { qos: 0 });
      client.subscribe('user/register', { qos: 0 });
      client.subscribe('user/logout', { qos: 0 });
    });

    client.on('message', (topic, message, packet) => {
      console.log(`Received Message: ${message.toString()} On topic: ${topic}`);

      if (topic === 'user/login') {
        toast.success('Logged in successfully');
      } else if (topic === 'user/register') {
        toast.success('Registered successfully');
      } else if (topic === 'user/logout') {
        toast.success('Logged out successfully');
      }
    });

    setClient(client);
    return () => {
      console.log('Disconnecting mqtt client');
      client.end();
    };
  }, [setUser]);

  return (
    <>
      <h1>Health Tracker</h1>
      <h1>User</h1>
      <h2>Login</h2>
      <form onSubmit={formik.handleSubmit}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            onChange={formik.handleChange}
            value={formik.values.email}
          />
          {formik.errors.email ? (
            <div className={styles.error}>{formik.errors.email}</div>
          ) : null}
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            onChange={formik.handleChange}
            value={formik.values.password}
          />
          {formik.errors.password ? (
            <div className={styles.error}>{formik.errors.password}</div>
          ) : null}
        </div>

        <button type="submit">Submit</button>
      </form>
      <h2>Register</h2>
      <form onSubmit={formikRegister.handleSubmit}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            onChange={formikRegister.handleChange}
            value={formikRegister.values.email}
          />
          {formikRegister.errors.email ? (
            <div className={styles.error}>{formikRegister.errors.email}</div>
          ) : null}
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            onChange={formikRegister.handleChange}
            value={formikRegister.values.password}
          />
          {formikRegister.errors.password ? (
            <div className={styles.error}>
              {formikRegister.errors.password}
            </div>
          ) : null}
        </div>

        <div>
          <label htmlFor="passwordConfirm">Password Confirm</label>
          <input
            type="password"
            id="passwordConfirm"
            name="passwordConfirm"
            onChange={formikRegister.handleChange}
            value={formikRegister.values.passwordConfirm}
          />
          {formikRegister.errors.passwordConfirm ? (
            <div className={styles.error}>
              {formikRegister.errors.passwordConfirm}
            </div>
          ) : null}
        </div>

        <button type="submit">Submit</button>
      </form>
      <h2>Logout</h2>
      <form onSubmit={formikLogout.handleSubmit}>
        <button type="submit">Log out</button>
      </form>
      {user && user.success ? (
        <div className={styles.connected}>User is Connected</div>
      ) : (
        <div className={styles.disconnected}>User is Disconnected</div>
      )
      }
      <h2>Chat</h2>
      <div className={styles.chatContainer}>
        <div className={styles.chatMessages}>
          {chatMessages.map((msg, index) => (
            <div key={index} className={styles.chatMessage}>
              {msg.user === null ? (
              <>
              <strong>hej</strong> {msg.message}
              </>
              ) : (
                <>
                <strong>{msg.user.user.email}</strong> {msg.message}
                </>
              )}

            </div>
          ))}
      </div>
        <form onSubmit={formikChat.handleSubmit}>
          <div>
            <label htmlFor="message">Message</label>
            <input
              type="text"
              id="message"
              name="message"
              onChange={formikChat.handleChange}
              value={formikChat.values.message}
            />
          </div>
          <button type="submit">Send</button>
        </form>
    </div>

        <h2>Change user data</h2>
        <form onSubmit={formikUserPatch.handleSubmit}>
          <div>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              onChange={formikUserPatch.handleChange}
              value={formikUserPatch.values.email}
            />
            {formikUserPatch.errors.email ? (
              <div className={styles.error}>{formikUserPatch.errors.email}</div>
            ) : null}
          </div>

          <div>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              onChange={formikUserPatch.handleChange}
              value={formikUserPatch.values.password}
            />
            {formikUserPatch.errors.password ? (
              <div className={styles.error}>
                {formikUserPatch.errors.password}
              </div>
            ) : null}
          </div>

          <button type="submit">Submit</button>
        </form>
        <h2>Delete user</h2>
        <form onSubmit={formikUserDelete.handleSubmit}>
          <div>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              onChange={formikUserDelete.handleChange}
              value={formikUserDelete.values.email}
            />
            {formikUserDelete.errors.email ? (
              <div className={styles.error}>{formikUserDelete.errors.email}</div>
            ) : null}
          </div>

          <div>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              onChange={formikUserDelete.handleChange}
              value={formikUserDelete.values.password}
            />
            {formikUserDelete.errors.password ? (
              <div className={styles.error}>
                {formikUserDelete.errors.password}
              </div>
            ) : null}
          </div>
          <button type="submit">Submit</button>
        </form>
        <h2>Get users</h2>
        <form onSubmit={formikGetUsers.handleSubmit}>
          <div>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              onChange={formikGetUsers.handleChange}
              value={formikGetUsers.values.email}
            />
            {formikGetUsers.errors.email ? (
              <div className={styles.error}>{formikGetUsers.errors.email}</div>
            ) : null}
            </div>
          <button type="submit">Get users</button>
        </form>
        {users && users.length > 0 ? (
          <div className={styles.users}>
            {users.map((user, index) => (
              <div key={index} className={styles.user}>
                <strong>{user.email}</strong>
              </div>
            ))}
          </div>
        ) : null
        }
    </>
  );
}