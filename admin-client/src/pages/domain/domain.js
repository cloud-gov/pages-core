export const stateColor = (state) => ({
  pending: 'bg-gray-30',
  provisioning: 'bg-gold',
  failed: 'bg-red',
  created: 'bg-mint',
}[state] || 'bg-gray-30');

export default {
  stateColor,
};
