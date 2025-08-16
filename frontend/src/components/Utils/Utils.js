export const formatDateToYYYYMMDD = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-based, so add 1 and pad with leading zeros
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function padTo2Digits(num) {
  return num.toString().padStart(2, '0');
}

// Function to format a date to `yyyy-mm-dd HH:MM`
export function formatDate(date) {
  return [
    date.getFullYear(),
    padTo2Digits(date.getMonth() + 1),
    padTo2Digits(date.getDate())
  ].join('-') + ' ' +
  [
    padTo2Digits(date.getHours()),
    padTo2Digits(date.getMinutes())
  ].join(':');
}

