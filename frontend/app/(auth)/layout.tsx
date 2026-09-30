//import custom components
import Flex from "components/common/Flex";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Flex
      tag='main'
      direction='column'
      justifyContent='center'
      alignItems='center'
      className='auth-wrapper min-vh-100 p-3'>
      {children}
    </Flex>
  );
};

export default AuthLayout;
