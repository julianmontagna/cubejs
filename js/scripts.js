$(document).ready(function() {

  $("#cube").cube({
    drag: {
      enabled: true,
      target: 'body',
      id: 'dragg-control',
      position: 'left bottom',
      opacityHover: 0.75,
      opacityOut: 0.25,
      opacityActive: 0.9,
    },
    shortcuts: {
      enabled: true
    },
    debug: {
      enabled: false
    }
  });

});
