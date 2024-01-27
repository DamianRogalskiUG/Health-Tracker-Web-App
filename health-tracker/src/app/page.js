'use client'
import React, { useEffect, useState } from "react";
import styles from "./page.module.css";
import { useFormik } from "formik";
import Cookie from "js-cookie";
import mqtt from "mqtt";
import { toast } from "react-toastify";


export default function Home() {
  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
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
        client.publish('user/login', 'User logged in successfully', { qos: 0, retain: false });
      }
    },
  });

  const formikRegister = useFormik({
    initialValues: {
      email: "",
      password: "",
      passwordConfirm: "",
    },
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

      }
    },
  });

  const [client, setClient] = useState(null);

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
    });

    client.on('message', (topic, message, packet) => {
      console.log(`Received Message: ${message.toString()} On topic: ${topic}`);

      if (topic === 'user/login') {
        toast.success('Logged in successfully');
      } else if (topic === 'user/register') {
        toast.success('Registered successfully');
      }
    });

    setClient(client);
    return () => {
      console.log('Disconnecting mqtt client');
      client.end();
    };
  }, []);

  return (
    <>
      <h1>Health Tracker</h1>
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
        <button>logout</button>
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

    </>
  );
}
