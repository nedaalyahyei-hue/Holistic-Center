 
import * as yup from "yup";
import RegisterValidation from "./RegisterValidation";
 
const CenterValidation = RegisterValidation.shape({
    email: yup
        .string()
        .required("Email is required")
        .matches(
            /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.om$/,
            "Email must end with .om"
        ),
 
    phone: yup
        .string()
        .required("Phone number is required")
        .matches(/^(24|9|7)[0-9]*$/, "Phone number must start with 24, 9, or 7")
        .length(8, "Phone number must be exactly 8 digits"),
});
 
export default CenterValidation;
 
 