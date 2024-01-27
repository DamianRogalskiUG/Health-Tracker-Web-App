'use client'
import React, { useEffect, useState } from "react";
import styles from "./page.module.css";
import { useFormik } from "formik";
import Cookie from "js-cookie";
import mqtt from "mqtt";
import { toast } from "react-toastify";
import * as Yup from "yup";


export const Measurements = () => {
    const [measurements, setMeasurements] = useState([]);

    const host = 'ws://broker.emqx.io:8083/mqtt';


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
          } else {
            alert('Błąd przy pobieraniu pomiarów');
          }
        }
      });
      useEffect(() => {
        const client = mqtt.connect(host);
        client.on('connect', () => {
            client.subscribe('measurements');

          });

        });

    return (
        <>
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
        </>
    )

}