import { forwardRef } from 'react';
import { Link } from 'react-router-dom';

import Button from './Button';

const ButtonLink = forwardRef(({ to, replace, state, ...props }, ref) => {
  return <Button ref={ref} as={Link} to={to} replace={replace} state={state} {...props} />;
});

export default ButtonLink;
