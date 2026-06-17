// react-dom is not available in React Native.
// This mock satisfies @clerk/clerk-react's import without breaking the app.
module.exports = {
  createPortal: (children) => children,
  findDOMNode: () => null,
  render: () => null,
  unmountComponentAtNode: () => false,
  flushSync: (fn) => fn(),
};
