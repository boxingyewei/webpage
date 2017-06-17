/*
 * 作者: sky.for.all
 * 日期: 2017/6/15
 */

 $(function(){
     // 设置导航栏的导航链接
     $(".em-nav").click(function(){
         $("#em-bd").attr("src", $(this).attr("page"));
     });
     $("#em-bd").attr("src", "page/index.html");
 });