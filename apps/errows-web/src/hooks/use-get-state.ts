import React from "react";
import type { Dispatch, SetStateAction } from "react";
/*
ahooks里面的getState没有那么及时，会导致问题
*/

type GetStateAction<S> = () => S;

function useGetState<S>(
  initialState: S | (() => S)
): [S, Dispatch<SetStateAction<S>>, GetStateAction<S>];
function useGetState<S = undefined>(): [
  S | undefined,
  Dispatch<SetStateAction<S | undefined>>,
  GetStateAction<S | undefined>
];
function useGetState<S>(initialState?: S) {
  const [state, setState] = React.useState(initialState);
  const stateRef = React.useRef(initialState);

  const getState = React.useCallback(() => stateRef.current, []);

  const setStateMerge = React.useCallback((value: SetStateAction<S>) => {
    const newValue = typeof value === 'function' ? (value as (prev: S) => S)(stateRef.current as S) : value;
    stateRef.current = newValue;
    setState(newValue);
  }, []);

  return [state, setStateMerge, getState];
}

export default useGetState;
