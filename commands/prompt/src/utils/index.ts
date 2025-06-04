import { isPromise } from 'node:util/types';

type AnyFunction = (...args: unknown[]) => unknown;

export const isFunction = (value: unknown): value is AnyFunction => {
  return typeof value === 'function';
};

export const isObject = (value: unknown): value is Record<PropertyKey, unknown> => {
  return value !== null && typeof value === 'object';
};

export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !Number.isNaN(value);
};

export const isBoolean = (value: unknown): value is boolean => {
  return typeof value === 'boolean';
};

export const isPromiseLike = <T = unknown>(
  value: unknown
): value is PromiseLike<T> => {
  return isObject(value) && isFunction((value as PromiseLike<T>).then);
};

export const isArray = Array.isArray;

export const isUndefined = (value: unknown): value is undefined => {
  return value === undefined;
};

export const isNull = (value: unknown): value is null => {
  return value === null;
};

export const isNil = (value: unknown): value is null | undefined => {
  return isNull(value) || isUndefined(value);
};

export const isEmpty = (value: unknown): boolean => {
  if (isNil(value)) return true;
  if (isArray(value)) return value.length === 0;
  if (isObject(value)) return Object.keys(value).length === 0;
  if (isString(value)) return value.trim().length === 0;
  return false;
};

export const noop = (): void => {};

export const createDeferred = <T>() => {
  let resolve: (value: T | PromiseLike<T>) => void = () => {};
  let reject: (reason?: unknown) => void = () => {};
  
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  
  return { promise, resolve, reject };
};

export const toPromise = <T>(value: T | Promise<T> | (() => T | Promise<T>)): Promise<T> => {
  if (isPromiseLike(value)) {
    return value as Promise<T>;
  }
  if (isFunction(value)) {
    try {
      const result = value();
      return isPromiseLike(result) ? result : Promise.resolve(result);
    } catch (error) {
      return Promise.reject(error);
    }
  }
  return Promise.resolve(value);
};

export const toArray = <T>(value: T | T[] | undefined | null): T[] => {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
};
