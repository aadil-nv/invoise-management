import { SignupFormValues } from "../interfaces/IAuthApi";
import { userInstance } from "../middlewares/axios";



export const loginUser = async (email: string, password: string) => {
    return userInstance.post('api/auth/login', { email, password }).then(res => res.data);
  };
  
  export const registerUser = async (values: SignupFormValues) => {
    return userInstance.post('api/auth/register', {
      name: values.name,
      username: values.username,
      email: values.email,
      password: values.password,
    });
  };
    