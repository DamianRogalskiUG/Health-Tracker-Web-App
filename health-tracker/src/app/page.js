'use client'
import styles from "./page.module.css";
import { useFormik } from "formik";



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
      console.log(res);
    },
  });

  const formikRegister = useFormik({
    initialValues: {
      email: "",
      password: "",
      passwordConfirm: "",
    },
    onSubmit: async (values) => {
      const res =await fetch("http://localhost:4000/register", { 
        method: "POST",
        body: JSON.stringify(values),
        headers: {
          "Content-Type": "application/json",
        },
      });
    },
  });

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
