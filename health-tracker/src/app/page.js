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
  const [targets, setTargets] = useState([]);
  const [activities, setActivities] = useState([]);
  const [logout, setLogout] = useState(false);
  const [login, setLogin] = useState(false);
  const [register, setRegister] = useState(false);
  const [message, setMessage] = useState('No message');
  


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
        setLogout(true);
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
        client.publish('user/notification', 'User registered in successfully', { qos: 0, retain: false });
        client.publish('user/register', 'User registered in successfully', { qos: 0, retain: false });
        setUser(data);
        setLogout(true);
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
        setLogout(prevState => !prevState)
        client.publish('user/logout', 'User logged out successfully', { qos: 0, retain: false });
        client.publish('user/presence', 'User is offline', { qos: 0, retain: false });
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
        client.publish('user/measurementsGet', 'User got measurements successfully', { qos: 0, retain: false });
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
        client.publish('user/measurementsAdd', 'User added measurements successfully', { qos: 0, retain: false });
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

  const formikDeleteMeasurements = useFormik({
    initialValues: {
      email: "",
    },
    validationSchema: Yup.object({
      email: Yup.string().email("Invalid email address").required("Required"),
      }),
    onSubmit: async (values) => {
      console.log(values.email)
      const res = await fetch(`http://localhost:4000/measurements`, {
        method: "DELETE",
        body: JSON.stringify(values),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        const data = await res.json();
        alert("Usunięto pomiary");
        client.publish('user/measurementsDelete', 'User deleted measurements successfully', { qos: 0, retain: false });
      } else {
        alert('Błąd przy usuwaniu pomiarów');
      }
    }
  });
  const formikGetUsers = useFormik({
    initialValues: {
      email: "",
    },
    validationSchema: Yup.object({
      email: Yup.string().email("Invalid email address").required("Required"),
      }),
    onSubmit: async (values) => {
      const res = await fetch(`http://localhost:4000/users?email=${values.email}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        const data = await res.json();
        alert("Pobrano użytkowników");
        setUsers(data);
        client.publish('user/usersGet', 'User got the users successfully', { qos: 0, retain: false });
      } else {
        alert('Błąd przy pobieraniu użytkowników');
      }
    }
  });

  const formikGetTargets = useFormik({
    initialValues: {
      name: "",
    },
    onSubmit: async (values) => {
      const res = await fetch(`http://localhost:4000/targets?name=${values.name}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        const data = await res.json();
        alert("Pobrano cele");
        setTargets(data);
        client.publish('user/targetsGet', 'User got the target successfully', { qos: 0, retain: false });
      } else {
        alert('Błąd przy pobieraniu celów');
      }
    }
  });

  const formikPostTargets = useFormik({
    initialValues: {
      name: "",
      desc: "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Required"),
      desc: Yup.string().required("Required"),
      }),
    onSubmit: async (values) => {
      const res = await fetch(`http://localhost:4000/targets`, {
        method: "POST",
        body: JSON.stringify(values),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        const data = await res.json();
        alert("Dodano cele");
        client.publish('user/targetsPost', 'User added the target successfully', { qos: 0, retain: false });
      } else {
        alert('Błąd przy dodawaniu celów');
      }
    }
  });

  const formikPatchTargets = useFormik({
    initialValues: {
      name: "",
      newName: "",
      desc: "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Required"),
      desc: Yup.string().required("Required"),
      }),
    onSubmit: async (values) => {
      const res = await fetch(`http://localhost:4000/targets`, {
        method: "PATCH",
        body: JSON.stringify(values),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        alert("Zmieniono cele");
        client.publish('user/targetsPatch', 'User updated the target successfully', { qos: 0, retain: false });
      } else {
        alert('Błąd przy zmianie celów');
      }
    }
  });

  const formikDeleteTargets = useFormik({
    initialValues: {
      name: "",
    },
    onSubmit: async (values) => {
      const res = await fetch(`http://localhost:4000/targets`, {
        method: "DELETE",
        body: JSON.stringify(values),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        alert("Usunięto cele");
        client.publish('user/targetsDelete', 'User deleted a target successfully', { qos: 0, retain: false });

      } else {
        alert('Błąd przy usuwaniu celów');
      }
    }
  });

  const formikGetActivities = useFormik({
    initialValues: {
      name: "",
    },
    onSubmit: async (values) => {
      const res = await fetch(`http://localhost:4000/activities?name=${values.name}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        const data = await res.json();
        alert("Pobrano aktywności");
        setActivities(data);
        client.publish('user/activitiesGet', 'User got the activities successfully', { qos: 0, retain: false });
      } else {
        alert('Błąd przy pobieraniu aktywności');
      }
    }
  });

  const formikPostActivities = useFormik({
    initialValues: {
      name: "",
      newName: "",
      desc: "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Required"),
      desc: Yup.string().required("Required"),
      }),
    onSubmit: async (values) => {
      const res = await fetch(`http://localhost:4000/activities`, {
        method: "POST",
        body: JSON.stringify(values),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        alert("Dodano aktywności");
        client.publish('user/activitiesPost', 'User added the activities successfully', { qos: 0, retain: false });
      } else {
        alert('Błąd przy dodawaniu aktywności');
      }
    }
  });

  const formikPatchActivities = useFormik({
    initialValues: {
      name: "",
      desc: "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Required"),
      desc: Yup.string().required("Required"),
      }),
    onSubmit: async (values) => {
      const res = await fetch(`http://localhost:4000/activities`, {
        method: "PATCH",
        body: JSON.stringify(values),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        alert("Zmieniono aktywności");
        client.publish('user/activitiesPatch', 'User updated the activities successfully', { qos: 0, retain: false });

      } else {
        alert('Błąd przy zmianie aktywności');
      }
    }
  });

  const formikDeleteActivities = useFormik({
    initialValues: {
      name: "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Required"),
      }),
    onSubmit: async (values) => {
      const res = await fetch(`http://localhost:4000/activities`, {
        method: "DELETE",
        body: JSON.stringify(values),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        alert("Usunięto aktywności");
        client.publish('user/activitiesDelete', 'User deleted the activities successfully', { qos: 0, retain: false });
      } else {
        alert('Błąd przy usuwaniu aktywności');
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
      client.subscribe('user/measurementsDelete', { qos: 0 });
      client.subscribe('user/targetsGet', { qos: 0 });
      client.subscribe('user/targetsPost', { qos: 0 });
      client.subscribe('user/targetsPatch', { qos: 0 });
      client.subscribe('user/targetsDelete', { qos: 0 });
      client.subscribe('user/activitiesGet', { qos: 0 });
      client.subscribe('user/activitiesPost', { qos: 0 });
      client.subscribe('user/activitiesPatch', { qos: 0 });
      client.subscribe('user/activitiesDelete', { qos: 0 });
      client.subscribe('user/usersGet', { qos: 0 });
    });

    client.on('message', (topic, message, packet) => {
      if (topic === 'user/notification') {
        toast.info(`${client.toString()} is online`);
      }
      console.log(`Received Message: ${message.toString()} On topic: ${topic}`);
      if (topic === 'user/login') {
        toast.success('Logged in successfully');
        setNotifications(prevState => [...prevState, message.toString()]);
      } else if (topic === 'user/register') {
        toast.success('Registered successfully');
        setNotifications(prevState => [...prevState, message.toString()]);
      } else if (topic === 'user/logout') {
        toast.success('Logged out successfully');
        setNotifications(prevState => [...prevState, message.toString()]);
      } else if (topic === 'user/updateUser') {
        toast.success('Updated the account successfully');
        setNotifications(prevState => [...prevState, message.toString()]);
      } else if (topic === 'user/deleteUser') {
        toast.success('Deleted the account successfully');
        setNotifications(prevState => [...prevState, message.toString()]);
      } else if (topic === 'user/measurementsGet') {
        toast.success('Got measurements successfully');
        setNotifications(prevState => [...prevState, message.toString()]);
      } else if (topic === 'user/measurementsPost') {
        toast.success('Added measurements successfully');
        setNotifications(prevState => [...prevState, message.toString()]);
      } else if (topic === 'user/measurementsPatch') {
        toast.success('Updated measurements successfully');
        setNotifications(prevState => [...prevState, message.toString()]);
      } else if (topic === 'user/measurementsDelete') {
        toast.success('Deleted measurements successfully');
        setNotifications(prevState => [...prevState, message.toString()]);
      } else if (topic === 'user/targetsGet') {
        toast.success('Got targets successfully');
        setNotifications(prevState => [...prevState, message.toString()]);
      } else if (topic === 'user/targetsPost') {
        toast.success('Added targets successfully');
        setNotifications(prevState => [...prevState, message.toString()]);
      } else if (topic === 'user/targetsPatch') {
        toast.success('Updated targets successfully');
        setNotifications(prevState => [...prevState, message.toString()]);
      } else if (topic === 'user/targetsDelete') {
        toast.success('Deleted targets successfully');
        setNotifications(prevState => [...prevState, message.toString()]);
      } else if (topic === 'user/activitiesGet') {
        toast.success('Got activities successfully');
        setNotifications(prevState => [...prevState, message.toString()]);
      } else if (topic === 'user/activitiesPost') {
        toast.success('Added activities successfully');
        setNotifications(prevState => [...prevState, message.toString()]);
      } else if (topic === 'user/activitiesPatch') {
        toast.success('Updated activities successfully');
        setNotifications(prevState => [...prevState, message.toString()]);
      } else if (topic === 'user/activitiesDelete') {
        toast.success('Deleted activities successfully');
        setNotifications(prevState => [...prevState, message.toString()]);
      } else if (topic === 'user/usersGet') {
        toast.success('Got users successfully');
        setNotifications(prevState => [...prevState, message.toString()]);
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
      <div className="nav">
        <div className="Logo">Health Tracker</div>
      </div>

      {!logout && 
      <>
      <div className="LoginContainer">
        <button onClick={() => setLogin(prevState => !prevState)}>Login Form</button>
        {login && <form onSubmit={formik.handleSubmit}>
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
        </form>}
      </div> 
      <div className="RegisterContainer">
        <button onClick={() => setRegister(prevState => !prevState)}>Register Form</button>
        {register && <form onSubmit={formikRegister.handleSubmit}>
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
        </form>}
      </div>
      </>
      }
      <div className="LogoutContainer">
      {logout && 
      <>
        <form onSubmit={formikLogout.handleSubmit}>
          <button type="submit">Log out</button>
        </form>
      </>
      }
        {user && user.success ? (
          <div className='connected'>User is Connected</div>
        ) : (
          <div className='disconnected'>User is Disconnected</div>
        )
        }
      </div>
      <div className="ChatContainer">
        <h2>Chat</h2>
        <div className={styles.chatContainer}>
          <div className={styles.chatMessages}>
            {chatMessages.map((msg, index) => (
              <div key={index} className={styles.chatMessage}>
                {msg.user === null ? (
                <>
                <strong>Anonim</strong> {msg.message}
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
    </div>
    <div className="NotificationTab">
          <h2>Notifications</h2>
          <ul>
              {notifications && notifications.length > 0  && (
                notifications.map((notification, index) => (
                  <li key={index} className={styles.notification}>
                    <span>{notification}</span>
                    <button onClick={() => setNotifications(prevState => prevState.filter((_, i) => i !== index))}>X</button>
                  </li>
                ))
              )}
          </ul>
      </div>
      <div className="UserContainer">
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
        {users && users.length > 0  && (
          <ul className={styles.users}>
            {users.map((user, index) => (
              <li key={index} className={styles.user}>
                <span>{user.email}</span>
              </li>
            ))}
          </ul>
        )}
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

      </div>
      <div className="MeasurementsContainer">
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
          <ul className={styles.measurements}>
            {measurements.map((measurement, index) => (
              <li key={index} className={styles.measurement}>
                <span>{measurement.weight}</span>
              </li>
            ))}
          </ul>
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
        <h2>Delete measurements</h2>
          <form onSubmit={formikDeleteMeasurements.handleSubmit}>
            <div>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                onChange={formikDeleteMeasurements.handleChange}
                value={formikDeleteMeasurements.values.email}
              />
              {formikDeleteMeasurements.errors.email ? (
                <div className={styles.error}>{formikDeleteMeasurements.errors.email}</div>
              ) : null}
            </div>
            <button type="submit">Delete measurements</button>
          </form>
        </div>
        <div className="TargetsContainer">
        <h2>Get targets</h2>
        <form onSubmit={formikGetTargets.handleSubmit}>
          <div>
            <label htmlFor="name">Name</label>
            <input
              type="name"
              id="name"
              name="name"
              onChange={formikGetTargets.handleChange}
              value={formikGetTargets.values.name}
            />
          </div>
          <button type="submit">Get targets</button>
        </form>
        {targets && targets.length > 0  && (
          <ul className={styles.targets}>
            {targets.map((target, index) => (
              <li key={index} className={styles.target}>
                <span>{target.name}</span>
                <span>{target.desc}</span>
              </li>
            ))}
          </ul>
        )}
        <h2>Add targets</h2>
          <form onSubmit={formikPostTargets.handleSubmit}>
            <div>
              <label htmlFor="name">Name</label>
              <input
                type="name"
                id="name"
                name="name"
                onChange={formikPostTargets.handleChange}
                value={formikPostTargets.values.name}
              />
              {formikPostTargets.errors.name ? (
                <div className={styles.error}>{formikPostTargets.errors.name}</div>
              ) : null}
            </div>
            <div>
              <label htmlFor="desc">Description</label>
              <input
                type="desc"
                id="desc"
                name="desc"
                onChange={formikPostTargets.handleChange}
                value={formikPostTargets.values.desc}
              />
              {formikPostTargets.errors.desc ? (
                <div className={styles.error}>{formikPostTargets.errors.desc}</div>
              ) : null}
            </div>
            <button type="submit">Add targets</button>
          </form>
        <h2>Change targets</h2>
          <form onSubmit={formikPatchTargets.handleSubmit}>
            <div>
              <label htmlFor="name">Name</label>
              <input
                type="name"
                id="name"
                name="name"
                onChange={formikPatchTargets.handleChange}
                value={formikPatchTargets.values.name}
              />
              {formikPatchTargets.errors.name ? (
                <div className={styles.error}>{formikPatchTargets.errors.name}</div>
              ) : null}
            </div>
            <div>
              <label htmlFor="newName">New Name</label>
              <input
                type="newName"
                id="newName"
                name="newName"
                onChange={formikPatchTargets.handleChange}
                value={formikPatchTargets.values.newName}
              />
              {formikPatchTargets.errors.newName ? (
                <div className={styles.error}>{formikPatchTargets.errors.newName}</div>
              ) : null}
            </div>
            <div>
              <label htmlFor="desc">Description</label>
              <input
                type="desc"
                id="desc"
                name="desc"
                onChange={formikPatchTargets.handleChange}
                value={formikPatchTargets.values.desc}
              />
              {formikPatchTargets.errors.desc ? (
                <div className={styles.error}>{formikPatchTargets.errors.desc}</div>
              ) : null}
            </div>
            <button type="submit">Change targets</button>
          </form>
          
        <h2>Delete targets</h2>
          <form onSubmit={formikDeleteTargets.handleSubmit}>
            <div>
              <label htmlFor="name">Name</label>
              <input
                type="name"
                id="name"
                name="name"
                onChange={formikDeleteTargets.handleChange}
                value={formikDeleteTargets.values.name}
              />
              {formikDeleteTargets.errors.name ? (
                <div className={styles.error}>{formikDeleteTargets.errors.name}</div>
              ) : null}
            </div>
            <button type="submit">Delete targets</button>
          </form>
        </div>
        <div className="ActivitiesContainer">
          <h2>Get activities</h2>
          <form onSubmit={formikGetActivities.handleSubmit}>
            <div>
              <label htmlFor="name">Name</label>
              <input
                type="name"
                id="name"
                name="name"
                onChange={formikGetActivities.handleChange}
                value={formikGetActivities.values.name}
              />
            </div>
            <button type="submit">Get activities</button>
          </form>
          {activities && activities.length > 0  && (
            <ul className={styles.activities}>
              {activities.map((activity, index) => (
                <li key={index} className={styles.activity}>
                  <span>{activity.name}</span>
                  <span>{activity.desc}</span>
                </li>
              ))}
            </ul>
          )}
          <h2>Add activities</h2>
            <form onSubmit={formikPostActivities.handleSubmit}>
              <div>
                <label htmlFor="name">Name</label>
                <input
                  type="name"
                  id="name"
                  name="name"
                  onChange={formikPostActivities.handleChange}
                  value={formikPostActivities.values.name}
                />
                {formikPostActivities.errors.name ? (
                  <div className={styles.error}>{formikPostActivities.errors.name}</div>
                ) : null}
              </div>
              <div>
                <label htmlFor="desc">Description</label>
                <input
                  type="desc"
                  id="desc"
                  name="desc"
                  onChange={formikPostActivities.handleChange}
                  value={formikPostActivities.values.desc}
                />
                {formikPostActivities.errors.desc ? (
                  <div className={styles.error}>{formikPostActivities.errors.desc}</div>
                ) : null}
              </div>
              <button type="submit">Add activities</button>
            </form>
          <h2>Change activities</h2>
            <form onSubmit={formikPatchActivities.handleSubmit}>
              <div>
                <label htmlFor="name">Name</label>
                <input
                  type="name"
                  id="name"
                  name="name"
                  onChange={formikPatchActivities.handleChange}
                  value={formikPatchActivities.values.name}
                />
                {formikPatchActivities.errors.name ? (
                  <div className={styles.error}>{formikPatchActivities.errors.name}</div>
                ) : null}
              </div>
              <div>
                <label htmlFor="newName">New Name</label>
                <input
                  type="newName"
                  id="newName"
                  name="newName"
                  onChange={formikPatchActivities.handleChange}
                  value={formikPatchActivities.values.newName}
                />
                {formikPatchActivities.errors.newName ? (
                  <div className={styles.error}>{formikPatchActivities.errors.newName}</div>
                ) : null}
              </div>
              <div>
                <label htmlFor="desc">Description</label>
                <input
                  type="desc"
                  id="desc"
                  name="desc"
                  onChange={formikPatchActivities.handleChange}
                  value={formikPatchActivities.values.desc}
                />
                {formikPatchActivities.errors.desc ? (
                  <div className={styles.error}>{formikPatchActivities.errors.desc}</div>
                ) : null}
              </div>
              <button type="submit">Change activities</button>
            </form>
            <h2>Delete activities</h2>
            <form onSubmit={formikDeleteActivities.handleSubmit}>
              <div>
                <label htmlFor="name">Name</label>
                <input
                  type="name"
                  id="name"
                  name="name"
                  onChange={formikDeleteActivities.handleChange}
                  value={formikDeleteActivities.values.name}
                />
                {formikDeleteActivities.errors.name ? (
                  <div className={styles.error}>{formikDeleteActivities.errors.name}</div>
                ) : null}
              </div>
              <button type="submit">Delete activities</button>
            </form>
        </div>
    </>
  );
}