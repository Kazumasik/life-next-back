const path = require('path');
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const util = require('util');

const audioDir = path.join(__dirname, 'audio');
const baseUrl = 'http://localhost:5002/audio';
const ensureAudioDirExists = async () => {
  try {
    await fs.promises.mkdir(audioDir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }
};

const getAudioUrl = async (word) => {
  const websiteUrl = `https://www.japandict.com/${encodeURIComponent(word)}`;
  try {
    const response = await axios.get(websiteUrl);
    const $ = cheerio.load(response.data);
    const playReadingBtn = $('.play-reading-btn');
    if (playReadingBtn.length === 0) {
      console.warn(`Не удалось найти кнопку проигрывания аудио на странице для слова ${word}`);
      return null;
    }
    const dataReadingValue = playReadingBtn.attr('data-reading');
    const dataReadingArray = JSON.parse(dataReadingValue);
    const baseAudioUrl = dataReadingArray[0];
    const audioPath = `read?text=${encodeURIComponent(dataReadingArray[1])}&outputFormat=mp3&jwt=${dataReadingArray[2]}&vid=${dataReadingArray[3]}`;
    const audioUrl = `${baseAudioUrl}/${audioPath}`;
    return audioUrl;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.warn(`Страница не найдена для слова ${word}`);
      return null;
    } else {
      console.error('Ошибка при получении HTML-страницы:', error.message);
      throw new Error('Ошибка при получении HTML-страницы');
    }
  }
};

const downloadAudio = async (audioUrl, word) => {
  const audioFilePath = path.join(audioDir, `${word}.mp3`);
  let audioFileExists;
  try {
    audioFileExists = await fs.promises.stat(audioFilePath);
  } catch (err) {
    if (err.code === 'ENOENT') {
      audioFileExists = false;
    } else {
      throw err;
    }
  }

  if (audioFileExists) {
    const formattedAudioUrl = `${baseUrl}/${encodeURIComponent(word)}.mp3`;
    return formattedAudioUrl;
  }

  const audioResponse = await axios.get(audioUrl, { responseType: 'stream' });
  const audioFileStream = fs.createWriteStream(audioFilePath);
  audioResponse.data.pipe(audioFileStream);
  const formattedAudioUrl = `${baseUrl}/${encodeURIComponent(word)}.mp3`;
  return formattedAudioUrl;
};


exports.downloadAudio = async (req, res) => {
  const word = req.params.word;

  try {
    await ensureAudioDirExists();
    const audioUrl = await getAudioUrl(word);

    const audioFiles = await fs.promises.readdir(audioDir);
    const existingFileIndex = audioFiles.findIndex(file => file.endsWith(`-${word}.mp3`));

    if (existingFileIndex !== -1) {
      const existingFilePath = path.join(audioDir, audioFiles[existingFileIndex]);
      return res.status(409).json({ error: `Аудио для слова "${word}" уже скачано.` });
    }

    const index = audioFiles.filter(file => file.endsWith('.mp3')).length + 1;
    const audioFilePath = await downloadAudio(audioUrl, word, index);
    return res.json({ audioFilePath, index });
  } catch (error) {
    console.error('Ошибка при получении HTML-страницы:', error);
    return res.status(500).json({ error: 'Ошибка при получении HTML-страницы' });
  }
};

const getTranslation = async (word) => {
  const websiteUrl = `https://www.japandict.com/${encodeURIComponent(word)}#entry-1495010`;
  const response = await axios.get(websiteUrl);
  const $ = cheerio.load(response.data);

  // Поиск блока с русским переводом по классу и атрибуту lang
  const russianTranslationBlock = $('.tab-pane div[lang="ru"]');
  const russianTranslation = russianTranslationBlock.text().trim();

  // Поиск блока с английским переводом по классу и атрибуту lang
  const englishTranslationBlock = $('.tab-pane div[lang="en"]');
  const englishTranslation = englishTranslationBlock.text().trim();


  return { ru: russianTranslation, en: englishTranslation };
};

exports.getTranslation = async (req, res) => {
  const word = req.params.word;

  try {
    const translation = await getTranslation(word);
    return res.json({ translation });
  } catch (error) {
    console.error('Ошибка при получении HTML-страницы:', error);
    return res.status(500).json({ error: 'Ошибка при получении HTML-страницы' });
  }
};

const readdir = util.promisify(fs.readdir);
const unlink = util.promisify(fs.unlink);

exports.deleteAllAudios = async (req, res) => {
  try {
    const audioFiles = await readdir(audioDir);
    const audioFilePaths = audioFiles
      .filter(file => file.endsWith('.mp3'))
      .map(file => path.join(audioDir, file));

    for (const filePath of audioFilePaths) {
      await unlink(filePath);
    }

    return res.json({ message: 'Все аудио файлы успешно удалены' });
  } catch (error) {
    console.error('Ошибка при удалении аудио файлов:', error);
    return res.status(500).json({ error: 'Ошибка при удалении аудио файлов' });
  }
};

  exports.downloadAllAudio = async (req, res) => {
    const { lines } = req.body;
    try {
      await ensureAudioDirExists();
      const audioUrlsPromises = lines.map(async (word) => {
        console.log(word);
        if (!word.japanese) {
          return word;
        }
        const audioUrl = await getAudioUrl(word.japanese);
        if (audioUrl) {
          const formattedAudioUrl = await downloadAudio(audioUrl, word.japanese);
          return { ...word, audioUrl: formattedAudioUrl };
        } else {
          return { ...word, audioUrl: '' };
        }
      });
      const audioUrls = await Promise.all(audioUrlsPromises);
      return res.json(audioUrls);
    } catch (error) {
      console.error('Ошибка при получении HTML-страницы:', error);
      return res.status(500).json({ error: 'Ошибка при получении HTML-страницы' });
    }
  };