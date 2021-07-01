import "./_snowpack/pkg/bootstrap.js";
import "./_snowpack/pkg/bootstrap/dist/css/bootstrap.min.css.proxy.js";
import axios from "./_snowpack/pkg/axios.js";
import prettyBytes from "./_snowpack/pkg/pretty-bytes.js";
import setupEditor from "./setupEditor.js";

const { requestEditor, updateResponseEditor } = setupEditor();

const form = document.querySelector("[data-form]");
const queryPamramsContainer = document.querySelector("[data-query-params]");
const requestHeadersContainer = document.querySelector(
  "[data-request-headers]"
);
const addQueryParamsBtn = document.querySelector("[data-add-query-params-btn]");
const addRequestHeadersBtn = document.querySelector(
  "[data-add-request-headers-btn]"
);
const responseHeadersContainer = document.querySelector(
  "[data-request-response-headers]"
);
let template = document.querySelector("[data-key-value-template]");

function createKeyValuePair() {
  const element = template.content.cloneNode(true);
  element.querySelector("[data-remove-btn]").addEventListener("click", (e) => {
    e.target.closest("[data-key-value-pair]").remove();
  });

  return element;
}

addQueryParamsBtn.addEventListener("click", (e) => {
  queryPamramsContainer.append(createKeyValuePair());
});
addRequestHeadersBtn.addEventListener("click", (e) => {
  requestHeadersContainer.append(createKeyValuePair());
});

queryPamramsContainer.append(createKeyValuePair());
requestHeadersContainer.append(createKeyValuePair());

axios.interceptors.request.use((req) => {
  req.customData = req.customData || {};
  req.customData.startTime = new Date().getTime();
  return req;
});

function updateEndtime(res) {
  res.customData = res.customData || {};
  res.customData.time = new Date().getTime() - res.config.customData.startTime;
  return res;
}

axios.interceptors.response.use(updateEndtime, (e) => {
  return Promise.reject(updateEndtime(e.response));
});

form.addEventListener("submit", (e) => {
  e.preventDefault();

  let data;
  try {
    data = JSON.parse(requestEditor.state.doc.toString() || null);
  } catch (error) {
    alert("JSON data is malformed");
    return;
  }

  axios({
    url: document.querySelector("[data-url]").value,
    method: document.querySelector("[data-methods]").value,
    params: keyValuePairToObject(queryPamramsContainer),
    headers: keyValuePairToObject(requestHeadersContainer),
    data,
  })
    .catch((e) => e)
    .then((res) => {
      document
        .querySelector("[data-response-section]")
        .classList.remove("d-none");

      console.log(res);
      updateResponseDetails(res);
      updateResponseEditor(res.data);
      updateResponseHeaders(res.headers);
    });
});

// .catch((err) => {
//   document
//     .querySelector("[data-response-section]")
//     .classList.remove("d-none");
//   updateResponseDetails(err.response);
//   updateResponseHeaders(err.response.headers);
//   console.log(err.response);
// })

function updateResponseDetails(res) {
  document.querySelector("[data-status]").textContent = res.status;
  document.querySelector("[data-time]").textContent = res.customData.time;
  document.querySelector("[data-size]").textContent = prettyBytes(
    JSON.stringify(res.data).length + JSON.stringify(res.headers).length
  );
}

function updateResponseHeaders(headers) {
  responseHeadersContainer.innerHTML = "";
  Object.entries(headers).forEach(([key, value]) => {
    const keyEl = document.createElement("div");
    keyEl.textContent = key;
    responseHeadersContainer.append(keyEl);
    const valueEl = document.createElement("div");
    valueEl.textContent = value;
    responseHeadersContainer.append(valueEl);
  });
}

function keyValuePairToObject(container) {
  const pairs = container.querySelectorAll("[data-key-value-pair]");
  return [...pairs].reduce((data, pair) => {
    const key = pair.querySelector("[data-key]").value;
    const value = pair.querySelector("[data-value]").value;

    if (key === "") return data;

    return { ...data, [key]: value };
  }, {});
}
