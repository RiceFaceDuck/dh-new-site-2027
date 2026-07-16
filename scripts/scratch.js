const test = null;
try {
  test.indexOf('a');
} catch (e) {
  console.log('Error for null:', e.message);
}

try {
  const undef = undefined;
  undef.indexOf('a');
} catch (e) {
  console.log('Error for undefined:', e.message);
}
