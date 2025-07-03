package com.petory.controller.shop;

import com.petory.entity.shop.ItemCategory;
import com.petory.repository.shop.ItemCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {
    private final ItemCategoryRepository itemCategoryRepository;

    @GetMapping
    public List<ItemCategory> getAllCategories() {
        return itemCategoryRepository.findAll();
    }
}
