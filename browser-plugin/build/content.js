/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
/*!************************!*\
  !*** ./src/content.js ***!
  \************************/
__webpack_require__.r(__webpack_exports__);
// content.js - the content script which runs in the context of web pages, and has access
// to the DOM and other web APIs.
//
// Example usage:
//
// import { ACTION_NAME } from "./constants.js";
// const message = {
//     action: ACTION_NAME,
//     text: 'Your input text here',
// }
// const response = await chrome.runtime.sendMessage(message);
// console.log('Generated text:', response)

// You can also add your own UI elements or handlers here to trigger text generation
// The context menu integration is handled by background.js

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudC5qcyIsIm1hcHBpbmdzIjoiOztVQUFBO1VBQ0E7Ozs7O1dDREE7V0FDQTtXQUNBO1dBQ0EsdURBQXVELGlCQUFpQjtXQUN4RTtXQUNBLGdEQUFnRCxhQUFhO1dBQzdEOzs7Ozs7Ozs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBWSxjQUFjO0FBQzFCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXMiOlsid2VicGFjazovL2hhbGx1Y2luYXRlLWV4dGVuc2lvbi93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9oYWxsdWNpbmF0ZS1leHRlbnNpb24vd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9oYWxsdWNpbmF0ZS1leHRlbnNpb24vLi9zcmMvY29udGVudC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBUaGUgcmVxdWlyZSBzY29wZVxudmFyIF9fd2VicGFja19yZXF1aXJlX18gPSB7fTtcblxuIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiLy8gY29udGVudC5qcyAtIHRoZSBjb250ZW50IHNjcmlwdCB3aGljaCBydW5zIGluIHRoZSBjb250ZXh0IG9mIHdlYiBwYWdlcywgYW5kIGhhcyBhY2Nlc3NcclxuLy8gdG8gdGhlIERPTSBhbmQgb3RoZXIgd2ViIEFQSXMuXHJcbi8vXHJcbi8vIEV4YW1wbGUgdXNhZ2U6XHJcbi8vXHJcbi8vIGltcG9ydCB7IEFDVElPTl9OQU1FIH0gZnJvbSBcIi4vY29uc3RhbnRzLmpzXCI7XHJcbi8vIGNvbnN0IG1lc3NhZ2UgPSB7XHJcbi8vICAgICBhY3Rpb246IEFDVElPTl9OQU1FLFxyXG4vLyAgICAgdGV4dDogJ1lvdXIgaW5wdXQgdGV4dCBoZXJlJyxcclxuLy8gfVxyXG4vLyBjb25zdCByZXNwb25zZSA9IGF3YWl0IGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKG1lc3NhZ2UpO1xyXG4vLyBjb25zb2xlLmxvZygnR2VuZXJhdGVkIHRleHQ6JywgcmVzcG9uc2UpXHJcblxyXG4vLyBZb3UgY2FuIGFsc28gYWRkIHlvdXIgb3duIFVJIGVsZW1lbnRzIG9yIGhhbmRsZXJzIGhlcmUgdG8gdHJpZ2dlciB0ZXh0IGdlbmVyYXRpb25cclxuLy8gVGhlIGNvbnRleHQgbWVudSBpbnRlZ3JhdGlvbiBpcyBoYW5kbGVkIGJ5IGJhY2tncm91bmQuanNcclxuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9