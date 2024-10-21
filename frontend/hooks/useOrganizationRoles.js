/* eslint-disable import/prefer-default-export */
import { useEffect, useState } from 'react';
import api from '../util/federalistApi';

const initState = {
  orgRoles: null,
  isLoading: true,
};

export const useOrganizationRoles = () => {
  const [state, setState] = useState(initState);

  useEffect(() => {
    api.fetchOrganizationRoles().then(data => setState({
      isLoading: false,
      orgRoles: data,
    }));
  }, []);

  return state;
};
