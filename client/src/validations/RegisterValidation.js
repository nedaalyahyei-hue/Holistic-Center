import * as yup from "yup";

const RegisterValidation = yup.object().shape({
  username: yup
    .string()
    .required("Center name is required")
    .max(50, "Center name must not exceed 50 characters")
    .matches(/^[A-Za-z0-9 ]+$/,"Center name must contain letters, numbers, or spaces only"),

  email: yup
    .string()
    .required("Email is required")
    .matches(/^[A-Za-z0-9._%+-]+@gmail\.com$/, "Email must be in format @gmail.com"),

  phone: yup
    .string()
    .required("Phone number is required")
    .matches(/^\d+$/, "Only numbers are allowed")
    .matches(/^[79][0-9]{7}$/, "Phone must start with 9 or 7 and be 8 digits"),

  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(
      /^(?=.*[A-Z])(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
      "Password must include at least one capital letter, one number, and one special character"
    ),

  confirmPassword: yup
    .string()
    .required("Confirm password is required")
    .oneOf([yup.ref("password")], "Passwords must match"),
});

export default RegisterValidation;