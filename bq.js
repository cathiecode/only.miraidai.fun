const BQ_OPTIONS = process.env.BQ_OPTIONS ? JSON.parse(process.env.BQ_OPTIONS) : {};

const { BigQuery } = require('@google-cloud/bigquery');

const bq = new BigQuery({ projectId: "link-miraidai-fun", ...BQ_OPTIONS });

const genId = () => {
  return require("base58").int_to_base58(Date.now());
}

const getUrlById = async (id) => {
  let result;
  try {
    result = await bq.query({
      query: "select url from urls.urls where id = @id",
      params: {
        id: id
      }
    });
  } catch (e) {
    throw "Internal Error";
  }

  if (result.length !== 1 || result[0].length !== 1) {
    throw "Not found";
  }

  return result[0][0].url;
}

const storeUrl = async (url, owner) => {
  const id = genId();

  await bq.query({
    query: "insert into urls.urls (url, owner, id) values (@url, @owner, @id)",
    params: {
      url: url,
      owner: owner,
      id: id
    }
  });

  return id;
}

module.exports = {
  getUrlById, storeUrl
}
