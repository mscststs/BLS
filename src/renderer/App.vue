<template>
  <div id="app">
    <landing-page></landing-page>
  </div>
</template>

<script>
import LandingPage from "@/components/LandingPage";

export default {
  name: "bls",
  components: {
    LandingPage
  }
};
</script>

<style>
/* CSS */
* {
  margin: 0;
  padding: 0;
  user-select: none;
  cursor: default;
}
input,
textarea,
pre {
  user-select: text;
}
#app {
  font-family: "PingFang SC", "Helvetica Neue", sans-serif;
  box-shadow: 0px 1px 2px 0px #ccc inset;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}

/* 全局样式覆盖 */
div.el-message {
  pointer-events: none;
  opacity: 0.9;
}
div.el-tabs__content {
  height: calc(100% - 30px);
  overflow-y: auto;
}
div::-webkit-scrollbar {
  width: 8px;
  background-color: transparent;
}

div::-webkit-scrollbar-thumb {
  box-shadow: 0 0 0 1px #fff inset;
  background-color: #aaa;
  border-radius: 20px;
}
</style>
