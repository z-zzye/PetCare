package com.petory.repository.shop;

import com.petory.entity.shop.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    // 필요시 커스텀 메서드 추가
    @Query("SELECT o FROM Order o WHERE o.merchantUid = :merchantUid AND o.member.member_Id = :memberId")
    Optional<Order> findByMerchantUidAndMemberId(@Param("merchantUid") String merchantUid, @Param("memberId") Long memberId);

    // 회원별 주문 목록 조회
    @Query("SELECT o FROM Order o WHERE o.member.member_Id = :memberId")
    List<Order> findByMemberId(@Param("memberId") Long memberId);

    // merchantUid만으로 주문 조회
    Optional<Order> findByMerchantUid(String merchantUid);

    // impUid로 주문 조회
    Optional<Order> findByImpUid(String impUid);
} 