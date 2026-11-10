export const numberToWords = (num: number) => {
  const rub = Math.floor(num);
  const kop = Math.round((num - rub) * 100);
  const rubStr = rub.toString();
  const lastDigit = rub % 10;
  const lastTwo = rub % 100;
  
  let rubWord = 'рублей';
  if (lastTwo < 11 || lastTwo > 14) {
    if (lastDigit === 1) rubWord = 'рубль';
    else if (lastDigit >= 2 && lastDigit <= 4) rubWord = 'рубля';
  }
  
  let kopWord = 'копеек';
  if (kop % 10 === 1 && kop % 100 !== 11) kopWord = 'копейка';
  else if (kop % 10 >= 2 && kop % 10 <= 4 && (kop % 100 < 10 || kop % 100 >= 20)) kopWord = 'копейки';
  
  return `${rubStr} ${rubWord} ${kop.toString().padStart(2, '0')} ${kopWord}`;
};