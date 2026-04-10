/* Copied from original template except for class names for cards.
Classnames used:
-page
-page-center
-card 
-card--form

*/

"use client"; // For components that need React hooks and browser APIs, SSR (server side rendering) has to be disabled. Read more here: https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering

import { useRouter } from "next/navigation"; // use NextJS router for navigation
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Button, Form, Input } from "antd";
import { UserAuthDTO, LoginPostDTO } from "@/types/user";


const Login: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [form] = Form.useForm();

  const {set: setToken,  } = useLocalStorage<string>("token", ""); 
  const handleLogin = async (values: LoginPostDTO) => {
      try {
        const loginCredentials: LoginPostDTO = {
          username: values.username,
          password: values.password,
        }
        const response = await apiService.post<UserAuthDTO>("/login", loginCredentials)
        setToken(response.token)
        router.push(`/users/${response.userId}`)
  
      } catch (error) {
  
        console.error("Registration failed:", error);
      }
    };

  return (
   <div className="page-center page-content" >
    <div className="card card--form">
      <Form
        form={form}
        name="login"
        size="large"
        variant="outlined"
        onFinish={handleLogin}
        layout="vertical"
      >
        <Form.Item
          name="username"
          label="Username"
          rules={[{ required: true, message: "Please input your username!" }]}
        >
          <Input placeholder="Enter username" />
        </Form.Item>
        <Form.Item
          name="password"
          label="Password"
          rules={[{ required: true, message: "Please input your password!" }]}
        >
          <Input.Password placeholder="" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" className="login-button">
            Login
          </Button>
        </Form.Item>
      </Form>
    </div>
    </div>
  );
};

export default Login;
