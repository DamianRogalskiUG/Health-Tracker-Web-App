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
  const [notifications, setNotifications] = useState([]);
  const [measurements, setMeasurements] = useState([]);

  
    const addNotification = (message, type) => {
      const newNotification = { id: Date.now(), message, type };
      setNotifications((prevNotifications) => [...prevNotifications, newNotification]);
    };
  
    const removeNotification = (id) => {
      setNotifications((prevNotifications) => prevNotifications.filter(notification => notification.id !== id));
    };
    useEffect(() => {
    const simulatedNotification = {
      id: Date.now(),
      message: "New notification received!",
      type: "info",
    };

    const notificationTimeout = setTimeout(() => {
      addNotification(simulatedNotification.message, simulatedNotification.type);
    }, 3000);

    return () => clearTimeout(notificationTimeout);
  }, []);

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
        client.publish('user/presence', 'User is online', { qos: 0, retain: false });

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
        client.publish('user/updateUser', 'User updated the account successfully', { qos: 0, retain: false });
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
          client.publish('user/deleteUser', 'User deleted the account successfully', { qos: 0, retain: false });
        } else {
          alert('Błąd przy usuwaniu konta');
        }
        setUser(data);
      } else {
        alert('Błąd przy usuwaniu konta');
      }
    }
  });

  const formikGetMeasurements = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: Yup.object({
        email: Yup.string().email("Invalid email address").required("Required"),
        }),
    onSubmit: async (values) => {
      console.log(values.email)
      const res = await fetch(`http://localhost:4000/measurements?email=${values.email}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        const data = await res.json();
        alert("Pobrano pomiary");
        setMeasurements(data);
        client.publish('user/logout', 'User got measurements successfully', { qos: 0, retain: false });

      } else {
        alert('Błąd przy pobieraniu pomiarów');
      }
    }
  });
  const formikPostMeasurements = useFormik({
    initialValues: {
      weight: "",
      height: "",
      email: "",
    },
    validationSchema: Yup.object({
      weight: Yup.number().required("Required"),
      height: Yup.number().required("Required"),
      email: Yup.string().email("Invalid email address").required("Required"),
      }),
    onSubmit: async (values) => {
      console.log(values.email)
      const res = await fetch(`http://localhost:4000/measurements`, {
        method: "POST",
        body: JSON.stringify(values),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        const data = await res.json();
        alert("Dodano pomiary");
        client.publish('user/logout', 'User added measurements successfully', { qos: 0, retain: false });

      } else {
        alert('Błąd przy dodawaniu pomiarów');
      }
    }
  });

  const formikPatchMeasurements = useFormik({
    initialValues: {
      weight: "",
      height: "",
      email: "",
    },
    validationSchema: Yup.object({
      weight: Yup.number().required("Required"),
      height: Yup.number().required("Required"),
      email: Yup.string().email("Invalid email address").required("Required"),
      }),
    onSubmit: async (values) => {
      console.log(values.email)
      const res = await fetch(`http://localhost:4000/measurements`, {
        method: "PATCH",
        body: JSON.stringify(values),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        const data = await res.json();
        alert("Zmieniono pomiary");
        client.publish('user/measurementsPatch', 'User updated measurements successfully', { qos: 0, retain: false });

      } else {
        alert('Błąd przy zmianie pomiarów');
      }
    }
  });


  useEffect(() => {
    if (client) {
      client.subscribe('user/presence', { qos: 0 });
    }
  }, [client]);

  


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
      client.subscribe('user/updateUser', { qos: 0 });
      client.subscribe('user/deleteUser', { qos: 0 });
      client.subscribe('user/measurementsGet', { qos: 0 });
      client.subscribe('user/measurementsPost', { qos: 0 });
      client.subscribe('user/measurementsPatch', { qos: 0 });

    });

    client.on('message', (topic, message, packet) => {
      if (topic === 'user/presence') {
        toast.info(`${client.toString()} is online`);
      }
      console.log(`Received Message: ${message.toString()} On topic: ${topic}`);
      if (topic === 'user/login') {
        toast.success('Logged in successfully');
      } else if (topic === 'user/register') {
        toast.success('Registered successfully');
      } else if (topic === 'user/logout') {
        toast.success('Logged out successfully');
      } else if (topic === 'user/updateUser') {
        toast.success('Updated the account successfully');
      } else if (topic === 'user/deleteUser') {
        toast.success('Deleted the account successfully');
      } else if (topic === 'user/measurementsGet') {
        toast.success('Got measurements successfully');
      } else if (topic === 'user/measurementsPost') {
        toast.success('Added measurements successfully');
      } else if (topic === 'user/measurementsPatch') {
        toast.success('Updated measurements successfully');
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
        <div className="notification-tab">
          <h2>Notifications</h2>
          <ul>
            {notifications.map((notification) => (
              <li key={notification.id} className={`notification ${notification.type}`}>
                <span>{notification.message}</span>
                <button onClick={() => removeNotification(notification.id)}>Close</button>
              </li>
            ))}
          </ul>
        </div>
        <h1>measurements</h1>
        <h2>Get measurements</h2>
        <form onSubmit={formikGetMeasurements.handleSubmit}>
          <div>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              onChange={formikGetMeasurements.handleChange}
              value={formikGetMeasurements.values.email}
            />
            {formikGetMeasurements.errors.email ? (
              <div className={styles.error}>{formikGetMeasurements.errors.email}</div>
            ) : null}
          </div>
          <button type="submit">Get measurements</button>
        </form>
        {measurements && measurements.length > 0  && (
          <div className={styles.measurements}>
            {measurements.map((measurement, index) => (
              <div key={index} className={styles.measurement}>
                <span>{measurement.weight}</span>
              </div>
            ))}
          </div>
        )}
        <h2>Add measurements</h2>
          <form onSubmit={formikPostMeasurements.handleSubmit}>
            <div>
              <label htmlFor="weight">Weight</label>
              <input
                type="number"
                id="weight"
                name="weight"
                onChange={formikPostMeasurements.handleChange}
                value={formikPostMeasurements.values.weight}
              />
              {formikPostMeasurements.errors.weight ? (
                <div className={styles.error}>{formikPostMeasurements.errors.weight}</div>
              ) : null}
            </div>
            <div>
              <label htmlFor="height">Height</label>
              <input
                type="number"
                id="height"
                name="height"
                onChange={formikPostMeasurements.handleChange}
                value={formikPostMeasurements.values.height}
              />
              {formikPostMeasurements.errors.height ? (
                <div className={styles.error}>{formikPostMeasurements.errors.height}</div>
              ) : null}
            </div>
            <div>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                onChange={formikPostMeasurements.handleChange}
                value={formikPostMeasurements.values.email}
              />
              {formikPostMeasurements.errors.email ? (
                <div className={styles.error}>{formikPostMeasurements.errors.email}</div>
              ) : null}
            </div>
            <button type="submit">Add measurements</button>
          </form>
        <h2>Change measurements</h2>
          <form onSubmit={formikPatchMeasurements.handleSubmit}>
            <div>
              <label htmlFor="weight">Weight</label>
              <input
                type="number"
                id="weight"
                name="weight"
                onChange={formikPatchMeasurements.handleChange}
                value={formikPatchMeasurements.values.weight}
              />
              {formikPatchMeasurements.errors.weight ? (
                <div className={styles.error}>{formikPatchMeasurements.errors.weight}</div>
              ) : null}
            </div>
            <div>
              <label htmlFor="height">Height</label>
              <input
                type="number"
                id="height"
                name="height"
                onChange={formikPatchMeasurements.handleChange}
                value={formikPatchMeasurements.values.height}
              />
              {formikPatchMeasurements.errors.height ? (
                <div className={styles.error}>{formikPatchMeasurements.errors.height}</div>
              ) : null}
            </div>
            <div>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                onChange={formikPatchMeasurements.handleChange}
                value={formikPatchMeasurements.values.email}
              />
              {formikPatchMeasurements.errors.email ? (
                <div className={styles.error}>{formikPatchMeasurements.errors.email}</div>
              ) : null}
            </div>
            <button type="submit">Change measurements</button>
          </form>
          
        
    </>
  );
}