import api from './index';

/**
 * 음성 명령(text)을 백엔드 NLU API로 보내 의도를 분석합니다.
 * @param {string} commandText (예: "강남역으로 가줘")
 */
export const parseCommand = (commandText) => {
  return api.post('/nlu/command', {
    commandText: commandText,
  });
};