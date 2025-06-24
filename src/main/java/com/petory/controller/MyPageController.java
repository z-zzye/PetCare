package com.petory.controller;

import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

public class MyPageController {
    @GetMapping(value = "/mypage/{userId}")
    public String viewMyPage(@PathVariable("userid")Long userId, Model model) {
        try {

        }
    }
}
