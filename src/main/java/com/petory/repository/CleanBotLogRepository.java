package com.petory.repository;

import com.petory.entity.CleanBotLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CleanBotLogRepository extends JpaRepository<CleanBotLog, Long> {
}
